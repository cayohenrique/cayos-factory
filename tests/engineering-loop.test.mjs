import test from "node:test";
import assert from "node:assert/strict";
import { cp, mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  applyEvent,
  buildReviewInput,
  classifyAmbiguity,
  decideWorkers,
  emptyLedger,
  fingerprintRisks,
  reviewModeForRisks,
} from "../scripts/engineering-loop.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const stateScript = path.join(root, "scripts/run-state.mjs");
const loopScript = path.join(root, "scripts/engineering-loop.mjs");
const handoffScript = path.join(root, "scripts/handoff.mjs");
const run = (script, args, cwd) => spawnSync(process.execPath, [script, ...args], { cwd, encoding: "utf8" });

async function fixture(prefix) {
  const work = await mkdtemp(path.join(os.tmpdir(), prefix));
  await cp(path.join(root, "tests/fixtures/web-app"), work, { recursive: true });
  execFileSync("git", ["init", "-q", "-b", "main"], { cwd: work });
  execFileSync("git", ["remote", "add", "origin", "https://github.com/example/fixture.git"], { cwd: work });
  execFileSync("git", ["add", "."], { cwd: work });
  execFileSync("git", ["-c", "user.name=Fixture", "-c", "user.email=fixture@example.com", "commit", "-qm", "fixture"], { cwd: work });
  return work;
}

function play(events) {
  return events.reduce((ledger, event) => applyEvent(ledger, event), emptyLedger());
}

test("normal small ticket: prepare implement fast-check review verify ready", () => {
  const ledger = play([
    { type: "prepare" },
    { type: "implement", agent: "cayos-implementer", taskId: "impl-1", workers: 1 },
    { type: "fast-check", passed: true },
    { type: "review", agent: "cayos-reviewer", findings: 0 },
    { type: "commit" },
    { type: "verify", passed: true },
  ]);
  assert.equal(ledger.phase, "READY");
  assert.equal(ledger.workers, 1);
  assert.equal(ledger.reviewPasses, 1);
  assert.equal(ledger.verifierRan, true);
  assert.equal(ledger.firstReviewBeforeCommit, true);
  assert.equal(ledger.events.some((event) => event.agent === "cayos-griller"), false);
  assert.equal(ledger.events.filter((event) => event.agent === "cayos-implementer").length, 1);
  assert.equal(ledger.events.filter((event) => event.agent === "cayos-reviewer").length, 1);
});

test("auto mode rejects griller and auto-responder", () => {
  assert.throws(() => play([{ type: "prepare" }, { type: "grill", agent: "cayos-griller" }]), /griller or auto-responder/);
  assert.throws(() => play([{ type: "prepare" }, { type: "implement", agent: "cayos-auto-responder" }]), /griller or auto-responder/);
});

test("review finding resumes implementer, re-reviews, and delays verify", () => {
  const ledger = play([
    { type: "prepare" },
    { type: "implement", taskId: "impl-1" },
    { type: "fast-check", passed: true },
    { type: "review", findings: 2 },
    { type: "fix", resume: true },
    { type: "fast-check", passed: true },
    { type: "review", findings: 0 },
    { type: "commit" },
    { type: "verify", passed: true },
  ]);
  assert.equal(ledger.reviewPasses, 2);
  assert.equal(ledger.reviewFixCycles, 1);
  assert.equal(ledger.phase, "READY");
  const types = ledger.events.map((event) => event.type);
  assert.ok(types.indexOf("verify") > types.lastIndexOf("review"));
  assert.throws(() => play([
    { type: "prepare" },
    { type: "implement", taskId: "impl-1" },
    { type: "fast-check", passed: true },
    { type: "review", findings: 1 },
    { type: "fix", resume: true },
    { type: "fast-check", passed: true },
    { type: "verify", passed: true },
  ]), /clean review/);
});

test("second review finding requires a third review and then blocks", () => {
  const blocked = play([
    { type: "prepare" },
    { type: "implement", taskId: "impl-1" },
    { type: "fast-check", passed: true },
    { type: "review", findings: 1 },
    { type: "fix", resume: true },
    { type: "fast-check", passed: true },
    { type: "review", findings: 1 },
    { type: "fix", resume: true },
    { type: "fast-check", passed: true },
    { type: "review", findings: 1 },
  ]);
  assert.equal(blocked.phase, "BLOCKED");
  assert.equal(blocked.reviewPasses, 3);

  const clean = play([
    { type: "prepare" },
    { type: "implement", taskId: "impl-1" },
    { type: "fast-check", passed: true },
    { type: "review", findings: 1 },
    { type: "fix", resume: true },
    { type: "fast-check", passed: true },
    { type: "review", findings: 1 },
    { type: "fix", resume: true },
    { type: "fast-check", passed: true },
    { type: "review", findings: 0 },
    { type: "commit" },
    { type: "verify", passed: true },
  ]);
  assert.equal(clean.phase, "READY");
  assert.equal(clean.reviewPasses, 3);
});

test("verification failure must be reviewed before another verify", () => {
  assert.throws(() => play([
    { type: "prepare" },
    { type: "implement", taskId: "impl-1" },
    { type: "fast-check", passed: true },
    { type: "review", findings: 0 },
    { type: "commit" },
    { type: "verify", passed: false },
    { type: "fix", resume: true, from: "verify" },
    { type: "fast-check", passed: true },
    { type: "verify", passed: true },
  ]), /clean review/);

  const ledger = play([
    { type: "prepare" },
    { type: "implement", taskId: "impl-1" },
    { type: "fast-check", passed: true },
    { type: "review", findings: 0 },
    { type: "commit" },
    { type: "verify", passed: false },
    { type: "fix", resume: true, from: "verify" },
    { type: "fast-check", passed: true },
    { type: "review", findings: 0 },
    { type: "commit" },
    { type: "verify", passed: true },
  ]);
  assert.equal(ledger.phase, "READY");
  assert.equal(ledger.verifyRepairCycles, 1);
  const verifyAt = ledger.events.map((event) => event.type).reduce((indexes, type, index) => type === "verify" ? [...indexes, index] : indexes, []);
  const lastFix = ledger.events.map((event) => event.type).lastIndexOf("fix");
  const reviewAfterFix = ledger.events.findIndex((event, index) => event.type === "review" && index > lastFix);
  assert.ok(reviewAfterFix > lastFix);
  assert.ok(verifyAt[1] > reviewAfterFix);
});

test("ambiguous ticket asks the user and does not implement", () => {
  const decision = classifyAmbiguity({
    repositoryResolves: false,
    establishedBehavior: false,
    productInterpretations: ["logout immediately", "retain session until expiration"],
  });
  assert.equal(decision.askUser, true);
  assert.throws(() => play([{ type: "prepare" }, { type: "ask-user" }, { type: "implement", taskId: "impl-1" }]), /user question is open/);
});

test("ambiguity resolvable from code does not ask the user", () => {
  const decision = classifyAmbiguity({ repositoryResolves: true, productInterpretations: ["A", "B"] });
  assert.equal(decision.askUser, false);
  const ledger = play([{ type: "prepare" }, { type: "implement", taskId: "impl-1", workers: 1 }]);
  assert.equal(ledger.phase, "IMPLEMENTING");
});

test("default worker count is one; dependent work stays one; true parallel may be two", () => {
  assert.equal(decideWorkers({ surfaces: ["ticket"] }), 1);
  assert.equal(decideWorkers({
    surfaces: ["migration", "service", "api"],
    layeredDependency: true,
    independent: false,
  }), 1);
  assert.equal(decideWorkers({
    surfaces: ["backend", "ui"],
    independent: true,
    bothStartImmediately: true,
    sharedFiles: [],
    wallClockAdvantage: true,
  }), 2);
  assert.throws(() => play([
    { type: "prepare" },
    { type: "implement", workers: 2 },
  ]), /independence justification/);
  const parallel = play([
    { type: "prepare" },
    {
      type: "implement",
      workers: 2,
      parallel: { surfaces: ["api", "ui"], independent: true, bothStartImmediately: true, sharedFiles: [], wallClockAdvantage: true },
    },
  ]);
  assert.equal(parallel.workers, 2);
});

test("reviewer input is ticket, acceptance, diff, and checks", () => {
  const input = buildReviewInput({
    ticket: "SAFE-1",
    acceptanceCriteria: ["returns greeting"],
    diff: "diff --git a/app.mjs",
    checks: ["node --test"],
    fastCheckOutput: "ok",
  });
  assert.equal(input.ticket, "SAFE-1");
  assert.ok(input.acceptanceCriteria);
  assert.ok(input.diff);
  assert.ok(input.checks);
  assert.equal(input.implementerNarrative, undefined);
  assert.throws(() => buildReviewInput({ ticket: "SAFE-1" }), /review input requires/);
});

test("commit is rejected before a clean review", () => {
  assert.throws(() => play([
    { type: "prepare" },
    { type: "implement", committed: true },
  ]), /must not commit before review/);
  assert.throws(() => play([
    { type: "prepare" },
    { type: "implement" },
    { type: "fast-check", passed: true },
    { type: "commit" },
  ]), /clean review/);
});

test("risk fingerprint comes from the diff", () => {
  assert.deepEqual(fingerprintRisks({ paths: ["src/auth/session.ts"] }), ["authorization"]);
  assert.equal(reviewModeForRisks(["authorization", "tenant-isolation"]), "deep");
  assert.equal(reviewModeForRisks(["localized"]), "fast");
  assert.deepEqual(fingerprintRisks({ paths: ["src/helpers/add.ts"] }), ["localized"]);
});

test("auto-advance skips grill gates and compact handoff works on the feature branch", async () => {
  const repo = await fixture("cayos-loop-auto-");
  let r = run(stateScript, ["init", "--root", repo, "--run-id", "loop", "--ticket", "fake:SAFE-1", "--mode", "auto"], repo);
  assert.equal(r.status, 0, r.stderr);
  r = run(stateScript, ["transition", "--root", repo, "--to", "TICKET_RESOLVED"], repo);
  assert.equal(r.status, 0, r.stderr);
  r = run(stateScript, ["auto-advance", "--root", repo, "--to", "PREPARING"], repo);
  assert.equal(r.status, 0, r.stderr + r.stdout);
  assert.equal(JSON.parse(r.stdout).state, "PREPARING");
  r = run(stateScript, ["auto-advance", "--root", repo, "--to", "IMPLEMENTING"], repo);
  assert.equal(r.status, 0, r.stderr + r.stdout);
  assert.equal(JSON.parse(r.stdout).state, "IMPLEMENTING");
  r = run(stateScript, ["checkpoint", "--root", repo, "--snapshot-id", "ticket-abc", "--reason", "snapshot"], repo);
  assert.equal(r.status, 0, r.stderr);
  execFileSync("git", ["checkout", "-q", "-b", "cayos/loop/ticket"], { cwd: repo });
  const dir = path.join(repo, ".cayos/runs/loop/handoffs");
  await mkdir(dir, { recursive: true });
  const input = path.join(dir, "input.json");
  const output = path.join(dir, "handoff.json");
  await writeFile(input, JSON.stringify({
    kind: "compact",
    ticket: "SAFE-1",
    snapshotId: "ticket-abc",
    acceptanceCriteria: ["returns greeting"],
    likelyFiles: ["app.mjs"],
    testSeam: { seam: "http" },
    checks: ["node --test"],
    constraints: [],
  }));
  r = run(handoffScript, ["create", "--root", repo, "--input", input, "--output", output], repo);
  assert.equal(r.status, 0, r.stderr);
  r = run(handoffScript, ["verify", "--root", repo, "--input", output], repo);
  assert.equal(r.status, 0, r.stderr);
  r = run(loopScript, ["init", "--root", repo], repo);
  assert.equal(r.status, 0, r.stderr);
  const event = path.join(repo, ".cayos/runs/loop/event.json");
  await writeFile(event, JSON.stringify({ type: "prepare" }));
  r = run(loopScript, ["record", "--root", repo, "--file", event], repo);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(JSON.parse(await readFile(path.join(repo, ".cayos/runs/loop/loop.json"), "utf8")).phase, "PREPARING");
});

test("auto-advance rejects manual runs", async () => {
  const repo = await fixture("cayos-loop-manual-");
  let r = run(stateScript, ["init", "--root", repo, "--run-id", "manual", "--ticket", "fake:SAFE-1"], repo);
  assert.equal(r.status, 0, r.stderr);
  r = run(stateScript, ["transition", "--root", repo, "--to", "TICKET_RESOLVED"], repo);
  assert.equal(r.status, 0, r.stderr);
  r = run(stateScript, ["auto-advance", "--root", repo, "--to", "PREPARING"], repo);
  assert.notEqual(r.status, 0);
});

test("auto-mode skill does not put grill on the hot path", async () => {
  const skill = await readFile(path.join(root, "skills/cayos-factory-auto-mode/SKILL.md"), "utf8");
  assert.match(skill, /prepare\.md/);
  assert.match(skill, /Do \*\*not\*\* invoke `cayos-griller`/);
  assert.doesNotMatch(skill, /grill-transcript/);
  assert.doesNotMatch(skill, /auto-approve --gate sharedUnderstanding/);
  const implement = await readFile(path.join(root, "skills/cayos-implement/SKILL.md"), "utf8");
  assert.match(implement, /without committing/);
  const verify = await readFile(path.join(root, "skills/cayos-verify/SKILL.md"), "utf8");
  assert.match(verify, /review.*verify again/i);
});
