import test from "node:test";
import assert from "node:assert/strict";
import { cp, mkdtemp, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { applyModelPolicyUpdate } from "../scripts/setup-update.mjs";
import { SUBAGENT_KEYS } from "../scripts/models.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const doctorScript = path.join(root, "scripts/doctor.mjs");
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

test("applyModelPolicyUpdate changes subagent bindings and refreshes localHash", async () => {
  const repo = await fixture("cayos-setup-update-");
  const before = JSON.parse(await readFile(path.join(repo, ".cayos/local.json"), "utf8"));
  assert.equal(before.models.subagents.smallTask, "fixture-model");
  const result = await applyModelPolicyUpdate(repo, {
    smallTask: "new-small",
    complexTask: "new-complex",
    reviewer: "new-reviewer",
  });
  const local = JSON.parse(await readFile(result.localPath, "utf8"));
  const lock = JSON.parse(await readFile(result.lockPath, "utf8"));
  assert.equal(local.models.subagents.smallTask, "new-small");
  assert.equal(local.models.subagents.complexTask, "new-complex");
  assert.equal(local.models.subagents.reviewer, "new-reviewer");
  assert.equal(lock.localHash, result.localHash);
  const doctor = run(doctorScript, ["--full", "--root", repo], repo);
  assert.equal(doctor.status, 0, doctor.stdout + doctor.stderr);
  assert.equal(JSON.parse(doctor.stdout).status, "READY");
});

test("applyModelPolicyUpdate supports fast and judgment group shortcuts", async () => {
  const repo = await fixture("cayos-setup-update-groups-");
  await applyModelPolicyUpdate(repo, { fast: "group-fast", judgment: "group-judge" });
  const local = JSON.parse(await readFile(path.join(repo, ".cayos/local.json"), "utf8"));
  assert.equal(local.models.subagents.grillInterviewer, "group-fast");
  assert.equal(local.models.subagents.mediumTask, "group-fast");
  assert.equal(local.models.subagents.grillInterviewee, "group-judge");
  assert.equal(local.models.subagents.reviewer, "group-judge");
});

test("setup-update cli rejects empty model flags", async () => {
  const repo = await fixture("cayos-setup-update-cli-");
  const script = path.join(root, "scripts/setup-update.mjs");
  const r = run(script, ["models", "--root", repo], repo);
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /at least one model flag/);
});

test("setup-update cli accepts per-subagent flags", async () => {
  const repo = await fixture("cayos-setup-update-flags-");
  const script = path.join(root, "scripts/setup-update.mjs");
  const r = run(script, ["models", "--root", repo, "--medium-task", "only-medium"], repo);
  assert.equal(r.status, 0, r.stderr);
  const local = JSON.parse(await readFile(path.join(repo, ".cayos/local.json"), "utf8"));
  assert.equal(local.models.subagents.mediumTask, "only-medium");
  for (const key of SUBAGENT_KEYS.filter((item) => item !== "mediumTask")) {
    assert.equal(local.models.subagents[key], "fixture-model");
  }
});
