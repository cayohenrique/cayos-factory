#!/usr/bin/env node
import path from "node:path";
import { readFile, realpath } from "node:fs/promises";
import { gitValue, json, locateActiveRoot, runDir, sha256, writeJson } from "./lib.mjs";

const [command, ...raw] = process.argv.slice(2);
const value = (name) => {
  const index = raw.indexOf(`--${name}`);
  return index >= 0 ? raw[index + 1] : "";
};
const root = path.resolve(value("root") || process.cwd());
const required = ["ticket", "acceptanceCriteria", "testSeam", "snapshotId", "baseCommit", "blockers", "integratedBlockers", "worktree", "projectGuidance", "domainDecisions", "boundaries", "checks"];

async function insideRun(target, base) {
  const baseReal = await realpath(path.resolve(base));
  const resolved = path.resolve(target);
  let cursor = resolved;
  while (true) {
    try {
      const cursorReal = await realpath(cursor);
      const suffix = path.relative(cursor, resolved);
      const targetReal = suffix ? path.join(cursorReal, suffix) : cursorReal;
      return targetReal === baseReal || targetReal.startsWith(`${baseReal}${path.sep}`);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      const parent = path.dirname(cursor);
      if (parent === cursor) return false;
      cursor = parent;
    }
  }
}

const insideWorktree = (target, base) => path.resolve(target).startsWith(`${path.resolve(base)}${path.sep}`);

function shape(payload) {
  const bad = required.filter((key) => !Object.hasOwn(payload, key));
  for (const key of ["acceptanceCriteria", "boundaries", "checks"]) {
    if (!Array.isArray(payload[key]) || !payload[key].length) bad.push(key);
  }
  for (const key of ["blockers", "integratedBlockers", "projectGuidance", "domainDecisions"]) {
    if (!Array.isArray(payload[key])) bad.push(key);
  }
  if (!payload.worktree?.path || !payload.worktree?.branch) bad.push("worktree");
  if (!/^[0-9a-f]{40,64}$/i.test(String(payload.baseCommit || ""))) bad.push("baseCommit");
  if (payload.checks?.some((check) => /^(?:true|:|echo(?:\s+.*)?)$/i.test(String(check).trim()))) bad.push("checks");
  return [...new Set(bad)];
}

async function context() {
  const active = await locateActiveRoot(root);
  if (!active) throw new Error("handoff requires active run");
  const dir = path.resolve(runDir(active.root, active.runId));
  const state = await json(path.join(dir, "state.json"));
  if (state.state !== "IMPLEMENTING") throw new Error(`handoff requires IMPLEMENTING; current ${state.state}`);
  return { dir, state };
}

async function operational(payload, contextState) {
  if (!contextState.state.ticketSnapshotId || payload.snapshotId !== contextState.state.ticketSnapshotId) {
    throw new Error("snapshot mismatch");
  }
  const worktreePath = path.resolve(payload.worktree.path);
  const owned = (contextState.state.ownedWorktrees || []).find(
    (item) => path.resolve(item.path) === worktreePath && item.branch === payload.worktree.branch,
  );
  if (!owned) throw new Error("worktree is not registered");
  if (
    payload.baseCommit !== owned.baseCommit
    || gitValue(worktreePath, ["rev-parse", "HEAD"], "") !== owned.expectedHead
    || sha256(gitValue(worktreePath, ["status", "--porcelain=v1", "-uall"], "")) !== owned.dirtyFingerprint
  ) {
    throw new Error("worktree/base changed after registration");
  }
  const topLevel = await realpath(gitValue(worktreePath, ["rev-parse", "--show-toplevel"], ""));
  const worktreeReal = await realpath(worktreePath);
  if (topLevel !== worktreeReal || !gitValue(worktreePath, ["rev-parse", "--verify", `${payload.baseCommit}^{commit}`], "")) {
    throw new Error("invalid worktree/base");
  }
  const integrated = new Set(payload.integratedBlockers.map(String));
  if (payload.blockers.some((blocker) => !integrated.has(String(blocker)))) throw new Error("unintegrated blockers");
  for (const guidance of payload.projectGuidance) {
    const guidancePath = path.resolve(worktreePath, String(guidance));
    if (!insideWorktree(guidancePath, worktreePath) || !gitValue(worktreePath, ["ls-files", "--error-unmatch", path.relative(worktreePath, guidancePath)], "")) {
      throw new Error(`missing guidance: ${guidance}`);
    }
  }
}

if (command === "create") {
  const contextState = await context();
  const input = path.resolve(value("input"));
  const output = path.resolve(value("output"));
  const base = path.resolve(contextState.dir, "handoffs");
  if (!(await insideRun(input, base)) || !(await insideRun(output, base))) throw new Error("handoff files must stay in active run");
  const payload = JSON.parse(await readFile(input, "utf8"));
  const bad = shape(payload);
  if (bad.length) throw new Error(`handoff missing: ${bad.join(", ")}`);
  await operational(payload, contextState);
  const hash = sha256(JSON.stringify(payload));
  await writeJson(output, { version: 1, sha256: hash, payload });
  console.log(JSON.stringify({ output, sha256: hash }));
} else if (command === "verify") {
  const contextState = await context();
  const input = path.resolve(value("input"));
  const base = path.resolve(contextState.dir, "handoffs");
  if (!(await insideRun(input, base))) throw new Error("handoff file escapes run");
  const envelope = JSON.parse(await readFile(input, "utf8"));
  const hash = sha256(JSON.stringify(envelope.payload));
  if (envelope.version !== 1 || hash !== envelope.sha256) throw new Error("handoff integrity failed");
  const bad = shape(envelope.payload);
  if (bad.length) throw new Error(`handoff missing: ${bad.join(", ")}`);
  await operational(envelope.payload, contextState);
  console.log(JSON.stringify({ valid: true, sha256: hash }));
} else {
  throw new Error("usage: handoff create|verify");
}
