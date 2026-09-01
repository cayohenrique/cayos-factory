import test from "node:test";
import assert from "node:assert/strict";
import { cp, mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const stateScript = path.join(root, "scripts/run-state.mjs");
const grillScript = path.join(root, "scripts/grill-transcript.mjs");
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

async function autoRun(repo, id = "auto") {
  let r = run(stateScript, ["init", "--root", repo, "--run-id", id, "--ticket", "fake:SAFE-1", "--mode", "auto"], repo);
  assert.equal(r.status, 0, r.stderr);
  for (const state of ["TICKET_RESOLVED", "UNDERSTANDING_PENDING"]) {
    r = run(stateScript, ["transition", "--root", repo, "--to", state], repo);
    assert.equal(r.status, 0, r.stderr);
  }
  return id;
}

test("grill transcript rejects incomplete batches and converge without rounds", async () => {
  const repo = await fixture("cayos-grill-");
  const id = await autoRun(repo);
  const proposal = path.join(repo, ".cayos/runs", id, "proposals", "sharedUnderstanding.md");
  const questions = path.join(repo, ".cayos/runs", id, "proposals", "sharedUnderstanding-questions-r1.json");
  await mkdir(path.dirname(proposal), { recursive: true });
  await writeFile(proposal, "understanding\n");
  await writeFile(questions, JSON.stringify({ needsFollowUp: false, questions: [{ id: "1", text: "What seam?" }] }));
  let r = run(grillScript, ["init", "--root", repo, "--gate", "sharedUnderstanding", "--proposal-file", proposal], repo);
  assert.equal(r.status, 0, r.stderr);
  r = run(grillScript, ["record-questions", "--root", repo, "--gate", "sharedUnderstanding", "--round", "1", "--file", questions], repo);
  assert.equal(r.status, 0, r.stderr);
  r = run(grillScript, ["record-questions", "--root", repo, "--gate", "sharedUnderstanding", "--round", "1", "--file", questions], repo);
  assert.notEqual(r.status, 0);
  const summary = path.join(repo, ".cayos/runs", id, "proposals", "sharedUnderstanding-summary.md");
  await writeFile(summary, "summary\n");
  r = run(grillScript, ["converge", "--root", repo, "--gate", "sharedUnderstanding", "--summary-file", summary], repo);
  assert.notEqual(r.status, 0);
});

test("grill transcript supports two batched rounds", async () => {
  const repo = await fixture("cayos-grill-rounds-");
  const id = await autoRun(repo);
  const proposal = path.join(repo, ".cayos/runs", id, "proposals", "sharedUnderstanding.md");
  const q1 = path.join(repo, ".cayos/runs", id, "proposals", "sharedUnderstanding-questions-r1.json");
  const a1 = path.join(repo, ".cayos/runs", id, "proposals", "sharedUnderstanding-answers-r1.json");
  const q2 = path.join(repo, ".cayos/runs", id, "proposals", "sharedUnderstanding-questions-r2.json");
  const a2 = path.join(repo, ".cayos/runs", id, "proposals", "sharedUnderstanding-answers-r2.json");
  const summary = path.join(repo, ".cayos/runs", id, "proposals", "sharedUnderstanding-summary.md");
  await mkdir(path.dirname(proposal), { recursive: true });
  await writeFile(proposal, "understanding\n");
  await writeFile(q1, JSON.stringify({ needsFollowUp: true, questions: [{ id: "1", text: "Seam?" }] }));
  await writeFile(a1, JSON.stringify({ answers: [{ id: "1", text: "HTTP boundary" }] }));
  await writeFile(q2, JSON.stringify({ needsFollowUp: false, questions: [{ id: "2", text: "Evidence path?" }] }));
  await writeFile(a2, JSON.stringify({ answers: [{ id: "2", text: "evidence/setup-response.json" }] }));
  await writeFile(summary, "summary\n");
  let r = run(grillScript, ["init", "--root", repo, "--gate", "sharedUnderstanding", "--proposal-file", proposal], repo);
  assert.equal(r.status, 0, r.stderr);
  r = run(grillScript, ["record-questions", "--root", repo, "--gate", "sharedUnderstanding", "--round", "1", "--file", q1], repo);
  assert.equal(r.status, 0, r.stderr);
  r = run(grillScript, ["record-answers", "--root", repo, "--gate", "sharedUnderstanding", "--round", "1", "--file", a1], repo);
  assert.equal(r.status, 0, r.stderr);
  r = run(grillScript, ["record-questions", "--root", repo, "--gate", "sharedUnderstanding", "--round", "2", "--file", q2], repo);
  assert.equal(r.status, 0, r.stderr);
  r = run(grillScript, ["record-answers", "--root", repo, "--gate", "sharedUnderstanding", "--round", "2", "--file", a2], repo);
  assert.equal(r.status, 0, r.stderr);
  r = run(grillScript, ["converge", "--root", repo, "--gate", "sharedUnderstanding", "--summary-file", summary], repo);
  assert.equal(r.status, 0, r.stderr);
  const transcript = JSON.parse(r.stdout);
  assert.equal(transcript.roundCount, 2);
});

test("auto-approve requires auto mode and converged grill", async () => {
  const repo = await fixture("cayos-auto-");
  const id = await autoRun(repo);
  const proposal = path.join(repo, ".cayos/runs", id, "proposals", "sharedUnderstanding.md");
  const grill = path.join(repo, ".cayos/runs", id, "grill", "sharedUnderstanding.json");
  const questions = path.join(repo, ".cayos/runs", id, "proposals", "sharedUnderstanding-questions-r1.json");
  const answers = path.join(repo, ".cayos/runs", id, "proposals", "sharedUnderstanding-answers-r1.json");
  const summary = path.join(repo, ".cayos/runs", id, "proposals", "sharedUnderstanding-summary.md");
  await mkdir(path.dirname(proposal), { recursive: true });
  await writeFile(proposal, "understanding\n");
  await writeFile(questions, JSON.stringify({ needsFollowUp: false, questions: [{ id: "1", text: "Seam?" }] }));
  await writeFile(answers, JSON.stringify({ answers: [{ id: "1", text: "HTTP boundary" }] }));
  await writeFile(summary, "summary\n");
  let r = run(stateScript, ["propose", "--root", repo, "--gate", "sharedUnderstanding", "--proposal-file", proposal], repo);
  assert.equal(r.status, 0, r.stderr);
  r = run(stateScript, ["auto-approve", "--root", repo, "--gate", "sharedUnderstanding", "--proposal-file", proposal, "--grill-file", grill, "--summary-file", summary], repo);
  assert.notEqual(r.status, 0);
  r = run(grillScript, ["init", "--root", repo, "--gate", "sharedUnderstanding", "--proposal-file", proposal], repo);
  assert.equal(r.status, 0, r.stderr);
  r = run(grillScript, ["record-questions", "--root", repo, "--gate", "sharedUnderstanding", "--round", "1", "--file", questions], repo);
  assert.equal(r.status, 0, r.stderr);
  r = run(grillScript, ["record-answers", "--root", repo, "--gate", "sharedUnderstanding", "--round", "1", "--file", answers], repo);
  assert.equal(r.status, 0, r.stderr);
  r = run(grillScript, ["converge", "--root", repo, "--gate", "sharedUnderstanding", "--summary-file", summary], repo);
  assert.equal(r.status, 0, r.stderr);
  r = run(stateScript, ["auto-approve", "--root", repo, "--gate", "sharedUnderstanding", "--proposal-file", proposal, "--grill-file", grill, "--summary-file", summary], repo);
  assert.equal(r.status, 0, r.stderr + r.stdout);
  const state = JSON.parse(r.stdout);
  assert.equal(state.state, "TEST_SEAM_PENDING");
  assert.equal(state.approvals.sharedUnderstanding.actor, "auto-grill");
});

test("auto-approve rejects manual runs", async () => {
  const repo = await fixture("cayos-auto-manual-");
  let r = run(stateScript, ["init", "--root", repo, "--run-id", "manual", "--ticket", "fake:SAFE-1"], repo);
  assert.equal(r.status, 0, r.stderr);
  r = run(stateScript, ["transition", "--root", repo, "--to", "TICKET_RESOLVED"], repo);
  assert.equal(r.status, 0, r.stderr);
  r = run(stateScript, ["transition", "--root", repo, "--to", "UNDERSTANDING_PENDING"], repo);
  assert.equal(r.status, 0, r.stderr);
  const proposal = path.join(repo, ".cayos/runs/manual/proposals/sharedUnderstanding.md");
  const grill = path.join(repo, ".cayos/runs/manual/grill/sharedUnderstanding.json");
  const summary = path.join(repo, ".cayos/runs/manual/proposals/sharedUnderstanding-summary.md");
  await mkdir(path.dirname(proposal), { recursive: true });
  await writeFile(proposal, "understanding\n");
  await writeFile(summary, "summary\n");
  r = run(stateScript, ["propose", "--root", repo, "--gate", "sharedUnderstanding", "--proposal-file", proposal], repo);
  assert.equal(r.status, 0, r.stderr);
  r = run(grillScript, ["init", "--root", repo, "--gate", "sharedUnderstanding", "--proposal-file", proposal], repo);
  assert.notEqual(r.status, 0);
  r = run(stateScript, ["auto-approve", "--root", repo, "--gate", "sharedUnderstanding", "--proposal-file", proposal, "--grill-file", grill, "--summary-file", summary], repo);
  assert.notEqual(r.status, 0);
});

test("auto init records autoMode flag", async () => {
  const repo = await fixture("cayos-auto-flag-");
  const r = run(stateScript, ["init", "--root", repo, "--run-id", "flag", "--ticket", "fake:SAFE-1", "--mode", "auto"], repo);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(JSON.parse(r.stdout).autoMode, true);
});
