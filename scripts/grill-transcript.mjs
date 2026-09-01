#!/usr/bin/env node
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { mkdir, readFile, realpath } from "node:fs/promises";
import { appendJsonl, json, locateActiveRoot, runDir, sha256, writeJson } from "./lib.mjs";

const [command, ...raw] = process.argv.slice(2);
const args = {};
for (let index = 0; index < raw.length; index += 1) {
  if (!raw[index].startsWith("--")) continue;
  const key = raw[index].slice(2);
  const next = raw[index + 1];
  args[key] = next && !next.startsWith("--") ? (index += 1, next) : true;
}

const root = path.resolve(String(args.root || process.cwd()));
const gate = String(args.gate || "");
const autoGates = new Set(["sharedUnderstanding", "testSeam", "ticketPlan", "implementation"]);
const inside = async (target, base) => {
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
      if (parent === cursor) throw new Error("path escapes approved repository");
      cursor = parent;
    }
  }
};

async function activeContext() {
  const active = await locateActiveRoot(root);
  if (!active) throw new Error("grill transcript requires an active run");
  const dir = path.resolve(runDir(active.root, active.runId));
  const state = await json(path.join(dir, "state.json"));
  return { active, dir, state };
}

function grillPath(dir, gateName) {
  return path.join(dir, "grill", `${gateName}.json`);
}

async function readGrill(file) {
  try {
    return await json(file);
  } catch (error) {
    if (error.code === "ENOENT") throw new Error(`grill transcript missing: ${file}`);
    throw error;
  }
}

function validateRole(role) {
  if (role !== "question" && role !== "answer") throw new Error("role must be question or answer");
}

async function initGrill() {
  if (!autoGates.has(gate)) throw new Error(`unsupported grill gate: ${gate}`);
  const { dir, state } = await activeContext();
  if (!state.autoMode) throw new Error("grill transcript requires auto mode run");
  const proposal = path.resolve(String(args["proposal-file"] || ""));
  const target = grillPath(dir, gate);
  if (!(await inside(proposal, dir))) throw new Error("grill paths must stay in active run");
  await mkdir(path.dirname(target), { recursive: true });
  const proposalHash = sha256(await readFile(proposal));
  const transcript = {
    version: 1,
    gate,
    status: "OPEN",
    proposalFile: path.relative(dir, proposal),
    proposalHash,
    rounds: 0,
    entries: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await writeJson(target, transcript);
  console.log(JSON.stringify({ grillFile: target, gate, status: transcript.status }, null, 2));
}

async function appendEntry() {
  const role = String(args.role || "");
  const content = String(args.content || "").trim();
  validateRole(role);
  if (!content) throw new Error("content is required");
  const { dir } = await activeContext();
  const target = grillPath(dir, gate);
  const transcript = await readGrill(target);
  if (transcript.status !== "OPEN") throw new Error("grill transcript is not open");
  if (role === "question" && transcript.entries.at(-1)?.role === "question") {
    throw new Error("cannot append consecutive questions without an answer");
  }
  if (role === "answer" && transcript.entries.at(-1)?.role !== "question") {
    throw new Error("answer requires a preceding question");
  }
  const entry = { at: new Date().toISOString(), role, content };
  const rounds = role === "answer" ? transcript.rounds + 1 : transcript.rounds;
  const next = { ...transcript, rounds, entries: [...transcript.entries, entry], updatedAt: entry.at };
  await writeJson(target, next);
  console.log(JSON.stringify({ grillFile: target, gate, rounds: next.rounds, entries: next.entries.length }, null, 2));
}

async function convergeGrill() {
  const { dir } = await activeContext();
  const target = grillPath(dir, gate);
  const transcript = await readGrill(target);
  if (transcript.status !== "OPEN") throw new Error("grill transcript is not open");
  if (transcript.rounds < 1) throw new Error("grill requires at least one question-answer round");
  if (transcript.entries.at(-1)?.role !== "answer") throw new Error("grill must end with an answer");
  const summary = path.resolve(String(args["summary-file"] || ""));
  if (!(await inside(summary, dir))) throw new Error("summary must stay in active run");
  const summaryBody = await readFile(summary, "utf8");
  if (!summaryBody.trim()) throw new Error("summary file is empty");
  const next = {
    ...transcript,
    status: "CONVERGED",
    summaryFile: path.relative(dir, summary),
    summaryHash: sha256(summaryBody),
    updatedAt: new Date().toISOString(),
  };
  await writeJson(target, next);
  console.log(JSON.stringify({ grillFile: target, gate, status: next.status, rounds: next.rounds }, null, 2));
}

async function showGrill() {
  const { dir } = await activeContext();
  const target = grillPath(dir, gate);
  console.log(JSON.stringify(await readGrill(target), null, 2));
}

export function validateGrillConverged(transcript) {
  if (transcript.status !== "CONVERGED") throw new Error("grill transcript is not converged");
  if (transcript.rounds < 1) throw new Error("grill transcript has no rounds");
  if (!transcript.summaryHash) throw new Error("grill transcript missing summary");
}

export function grillDigest(transcript) {
  return createHash("sha256").update(JSON.stringify({
    gate: transcript.gate,
    status: transcript.status,
    proposalHash: transcript.proposalHash,
    rounds: transcript.rounds,
    entries: transcript.entries,
    summaryHash: transcript.summaryHash,
  })).digest("hex");
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isMain) {
try {
  switch (command) {
    case "init":
      await initGrill();
      break;
    case "append":
      await appendEntry();
      break;
    case "converge":
      await convergeGrill();
      break;
    case "show":
      await showGrill();
      break;
    default:
      throw new Error("usage: grill-transcript.mjs init|append|converge|show");
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
}
