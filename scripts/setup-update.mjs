#!/usr/bin/env node
import path from "node:path";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { SUBAGENT_KEYS, applySubagentUpdates, validateModelPolicy } from "./models.mjs";

const sha256 = (value) => createHash("sha256").update(value).digest("hex");

const CLI_TO_SUBAGENT = {
  "grill-interviewer": "grillInterviewer",
  "grill-interviewee": "grillInterviewee",
  "small-task": "smallTask",
  "medium-task": "mediumTask",
  "complex-task": "complexTask",
  reviewer: "reviewer",
};

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    if (!argv[index].startsWith("--")) continue;
    const key = argv[index].slice(2);
    const next = argv[index + 1];
    args[key] = next && !next.startsWith("--") ? (index += 1, next) : true;
  }
  return args;
}

export function parseModelUpdates(args = {}) {
  const updates = {};
  for (const [flag, key] of Object.entries(CLI_TO_SUBAGENT)) {
    if (args[flag]) updates[key] = args[flag];
  }
  if (args.fast) updates.fast = args.fast;
  if (args.judgment) updates.judgment = args.judgment;
  if (args.grill) updates.grill = args.grill;
  if (args.respond) updates.respond = args.respond;
  return updates;
}

export async function applyModelPolicyUpdate(root, updates = {}) {
  const repo = path.resolve(root);
  const localPath = path.join(repo, ".cayos", "local.json");
  const lockPath = path.join(repo, ".cayos", "capabilities.lock.json");
  const local = JSON.parse(await readFile(localPath, "utf8"));
  local.models = applySubagentUpdates(local.models || {}, updates);
  const check = validateModelPolicy(local);
  if (!check.valid) throw new Error(check.errors.join(", "));
  const body = `${JSON.stringify(local, null, 2)}\n`;
  await writeFile(localPath, body);
  const lock = JSON.parse(await readFile(lockPath, "utf8"));
  lock.localHash = sha256(body);
  lock.checkedAt = new Date().toISOString();
  await writeFile(lockPath, `${JSON.stringify(lock, null, 2)}\n`);
  return { localPath, lockPath, localHash: lock.localHash, policy: check.policy };
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isMain) {
  const args = parseArgs(process.argv.slice(2));
  const command = process.argv[2];
  const root = path.resolve(String(args.root || process.cwd()));
  try {
    if (command !== "models") {
      throw new Error(
        "usage: setup-update.mjs models --root <repo> "
        + `[--${SUBAGENT_KEYS.map((key) => key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)).join("|--")} <model>] `
        + "[--fast <model>] [--judgment <model>]",
      );
    }
    const updates = parseModelUpdates(args);
    if (!Object.keys(updates).length) throw new Error("at least one model flag is required");
    const result = await applyModelPolicyUpdate(root, updates);
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
