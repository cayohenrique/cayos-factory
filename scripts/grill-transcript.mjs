#!/usr/bin/env node
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { mkdir, readFile, realpath } from "node:fs/promises";
import { json, locateActiveRoot, runDir, sha256, writeJson } from "./lib.mjs";

export const MAX_GRILL_ROUNDS = 2;

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
export const GATE_ORDER = ["sharedUnderstanding", "testSeam", "ticketPlan", "implementation"];
const autoGates = new Set(GATE_ORDER);

// A grill may cover one gate or a phase of adjacent gates (e.g. sharedUnderstanding,testSeam).
// `--gate` names the transcript file and must be the first gate of the phase.
export function normalizeGates(primary, list) {
  const gates = String(list || primary || "").split(",").map((item) => item.trim()).filter(Boolean);
  if (!gates.length) throw new Error("grill requires at least one gate");
  for (const item of gates) if (!autoGates.has(item)) throw new Error(`unsupported grill gate: ${item}`);
  if (new Set(gates).size !== gates.length) throw new Error("grill gates must be unique");
  const indexes = gates.map((item) => GATE_ORDER.indexOf(item)).sort((a, b) => a - b);
  for (let index = 1; index < indexes.length; index += 1) {
    if (indexes[index] !== indexes[index - 1] + 1) throw new Error("grill gates must be adjacent in the approval order");
  }
  const ordered = indexes.map((index) => GATE_ORDER[index]);
  if (ordered[0] !== primary) throw new Error("--gate must be the first gate covered by --gates");
  return ordered;
}

export function grillGates(transcript) {
  return Array.isArray(transcript?.gates) && transcript.gates.length ? transcript.gates.map(String) : [String(transcript?.gate || "")];
}

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

function roundIndex(value) {
  const round = Number(value);
  if (!Number.isInteger(round) || round < 1 || round > MAX_GRILL_ROUNDS) {
    throw new Error(`round must be an integer between 1 and ${MAX_GRILL_ROUNDS}`);
  }
  return round;
}

function normalizeQuestionBatch(payload) {
  const questions = Array.isArray(payload?.questions) ? payload.questions : [];
  if (!questions.length) throw new Error("questions batch must contain at least one question");
  return questions.map((item, index) => {
    const id = String(item?.id || index + 1);
    const text = String(item?.text || item?.content || "").trim();
    if (!text) throw new Error(`question ${id} is empty`);
    return {
      id,
      text,
      citation: item?.citation ? String(item.citation) : undefined,
      recommendation: item?.recommendation ? String(item.recommendation) : undefined,
    };
  });
}

function normalizeAnswerBatch(payload, questions) {
  const answers = Array.isArray(payload?.answers) ? payload.answers : [];
  if (!answers.length) throw new Error("answers batch must contain at least one answer");
  const byId = new Map(answers.map((item, index) => {
    const id = String(item?.id || index + 1);
    const text = String(item?.text || item?.content || "").trim();
    if (!text) throw new Error(`answer ${id} is empty`);
    return [id, { id, text }];
  }));
  for (const question of questions) {
    if (!byId.has(question.id)) throw new Error(`missing answer for question ${question.id}`);
  }
  return questions.map((question) => byId.get(question.id));
}

function completedRoundCount(transcript) {
  if (transcript.version === 1) return transcript.rounds || 0;
  return (transcript.rounds || []).filter((round) => round.questions?.length && round.answers?.length).length;
}

async function initGrill() {
  if (!autoGates.has(gate)) throw new Error(`unsupported grill gate: ${gate}`);
  const gates = normalizeGates(gate, args.gates);
  const { dir, state } = await activeContext();
  if (!state.autoMode) throw new Error("grill transcript requires auto mode run");
  const proposal = path.resolve(String(args["proposal-file"] || ""));
  const target = grillPath(dir, gate);
  if (!(await inside(proposal, dir))) throw new Error("grill paths must stay in active run");
  await mkdir(path.dirname(target), { recursive: true });
  const proposalHash = sha256(await readFile(proposal));
  const transcript = {
    version: 2,
    gate,
    gates,
    status: "OPEN",
    proposalFile: path.relative(dir, proposal),
    proposalHash,
    maxRounds: MAX_GRILL_ROUNDS,
    rounds: [],
    roundCount: 0,
    needsFollowUp: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await writeJson(target, transcript);
  console.log(JSON.stringify({ grillFile: target, gate, gates, status: transcript.status }, null, 2));
}

async function readBatchFile() {
  const file = path.resolve(String(args.file || ""));
  if (!file) throw new Error("file is required");
  return JSON.parse(await readFile(file, "utf8"));
}

async function recordQuestions() {
  const round = roundIndex(args.round);
  const { dir } = await activeContext();
  const target = grillPath(dir, gate);
  const transcript = await readGrill(target);
  if (transcript.status !== "OPEN") throw new Error("grill transcript is not open");
  if (transcript.version !== 2) throw new Error("record-questions requires grill transcript version 2");
  const existing = transcript.rounds.find((item) => item.index === round);
  if (existing?.questions?.length) throw new Error(`round ${round} questions already recorded`);
  if (round > 1) {
    const previous = transcript.rounds.find((item) => item.index === round - 1);
    if (!previous?.questions?.length || !previous?.answers?.length) {
      throw new Error(`round ${round - 1} must be complete before recording round ${round} questions`);
    }
  }
  const batchFile = path.resolve(String(args.file || ""));
  if (!(await inside(batchFile, dir))) throw new Error("question batch must stay in active run");
  const payload = await readBatchFile();
  const questions = normalizeQuestionBatch(payload);
  const nextRound = {
    index: round,
    questions,
    answers: [],
    questionsFile: path.relative(dir, batchFile),
    questionsRecordedAt: new Date().toISOString(),
  };
  const rounds = [...transcript.rounds.filter((item) => item.index !== round), nextRound].sort((a, b) => a.index - b.index);
  const next = {
    ...transcript,
    rounds,
    needsFollowUp: Boolean(payload.needsFollowUp),
    updatedAt: nextRound.questionsRecordedAt,
  };
  await writeJson(target, next);
  console.log(JSON.stringify({ grillFile: target, gate, round, questions: questions.length, needsFollowUp: next.needsFollowUp }, null, 2));
}

async function recordAnswers() {
  const round = roundIndex(args.round);
  const { dir } = await activeContext();
  const target = grillPath(dir, gate);
  const transcript = await readGrill(target);
  if (transcript.status !== "OPEN") throw new Error("grill transcript is not open");
  if (transcript.version !== 2) throw new Error("record-answers requires grill transcript version 2");
  const current = transcript.rounds.find((item) => item.index === round);
  if (!current?.questions?.length) throw new Error(`round ${round} questions are missing`);
  if (current.answers?.length) throw new Error(`round ${round} answers already recorded`);
  const batchFile = path.resolve(String(args.file || ""));
  if (!(await inside(batchFile, dir))) throw new Error("answer batch must stay in active run");
  const payload = await readBatchFile();
  const answers = normalizeAnswerBatch(payload, current.questions);
  const nextRound = {
    ...current,
    answers,
    answersFile: path.relative(dir, batchFile),
    answersRecordedAt: new Date().toISOString(),
  };
  const rounds = transcript.rounds.map((item) => (item.index === round ? nextRound : item));
  const next = {
    ...transcript,
    rounds,
    roundCount: completedRoundCount({ ...transcript, rounds }),
    updatedAt: nextRound.answersRecordedAt,
  };
  await writeJson(target, next);
  console.log(JSON.stringify({ grillFile: target, gate, round, answers: answers.length, roundCount: next.roundCount }, null, 2));
}

async function convergeGrill() {
  const { dir } = await activeContext();
  const target = grillPath(dir, gate);
  const transcript = await readGrill(target);
  if (transcript.status !== "OPEN") throw new Error("grill transcript is not open");
  const completed = completedRoundCount(transcript);
  if (completed < 1) throw new Error("grill requires at least one complete question-answer round");
  const openRound = (transcript.rounds || []).find((round) => round.questions?.length && !round.answers?.length);
  if (openRound) throw new Error(`round ${openRound.index} is missing answers`);
  const summary = path.resolve(String(args["summary-file"] || ""));
  if (!(await inside(summary, dir))) throw new Error("summary must stay in active run");
  const summaryBody = await readFile(summary, "utf8");
  if (!summaryBody.trim()) throw new Error("summary file is empty");
  const next = {
    ...transcript,
    status: "CONVERGED",
    summaryFile: path.relative(dir, summary),
    summaryHash: sha256(summaryBody),
    roundCount: completed,
    updatedAt: new Date().toISOString(),
  };
  await writeJson(target, next);
  console.log(JSON.stringify({ grillFile: target, gate, status: next.status, roundCount: next.roundCount }, null, 2));
}

async function showGrill() {
  const { dir } = await activeContext();
  const target = grillPath(dir, gate);
  console.log(JSON.stringify(await readGrill(target), null, 2));
}

export function validateGrillConverged(transcript) {
  if (transcript.status !== "CONVERGED") throw new Error("grill transcript is not converged");
  if (completedRoundCount(transcript) < 1) throw new Error("grill transcript has no complete rounds");
  if (!transcript.summaryHash) throw new Error("grill transcript missing summary");
  if (transcript.version === 2) {
    const incomplete = (transcript.rounds || []).find((round) => round.questions?.length && !round.answers?.length);
    if (incomplete) throw new Error(`round ${incomplete.index} is incomplete`);
    if ((transcript.rounds || []).length > MAX_GRILL_ROUNDS) throw new Error("grill exceeded max rounds");
  }
}

export function grillDigest(transcript) {
  const body = transcript.version === 2
    ? {
      version: transcript.version,
      gate: transcript.gate,
      gates: transcript.gates,
      status: transcript.status,
      proposalHash: transcript.proposalHash,
      roundCount: transcript.roundCount,
      rounds: transcript.rounds,
      summaryHash: transcript.summaryHash,
    }
    : {
      version: transcript.version || 1,
      gate: transcript.gate,
      status: transcript.status,
      proposalHash: transcript.proposalHash,
      rounds: transcript.rounds,
      entries: transcript.entries,
      summaryHash: transcript.summaryHash,
    };
  return createHash("sha256").update(JSON.stringify(body)).digest("hex");
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isMain) {
  try {
    switch (command) {
      case "init":
        await initGrill();
        break;
      case "record-questions":
        await recordQuestions();
        break;
      case "record-answers":
        await recordAnswers();
        break;
      case "converge":
        await convergeGrill();
        break;
      case "show":
        await showGrill();
        break;
      default:
        throw new Error("usage: grill-transcript.mjs init|record-questions|record-answers|converge|show");
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
