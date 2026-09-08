#!/usr/bin/env node
import path from "node:path";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { json, locateActiveRoot, runDir } from "./lib.mjs";

export const FORBIDDEN_AUTO_AGENTS = ["cayos-griller", "cayos-auto-responder"];
export const MAX_REVIEW_FIX_CYCLES = 2;
export const MAX_VERIFY_REPAIR_CYCLES = 2;
export const MAX_REVIEW_PASSES = 3;

const RISK_RULES = [
  { risk: "authorization", re: /auth|session|permission|role|tenant|organiz|rbac|acl/i },
  { risk: "schema", re: /migrat|schema|\.sql$|prisma|sequelize|drizzle|knex/i },
  { risk: "queues", re: /queue|worker|job|bull|sqs|sidekiq|celery/i },
  { risk: "external-api", re: /webhook|sdk|axios|openai|stripe|graphql-client/i },
  { risk: "ui-state", re: /\.(tsx|jsx|vue|svelte)$|components\/|hooks\//i },
  { risk: "public-contract", re: /openapi|swagger|graphql|\broutes\b|controllers\/|api\//i },
];

export function emptyLedger(extra = {}) {
  return {
    version: 1,
    mode: "auto",
    workers: 1,
    phase: "IDLE",
    events: [],
    implementerTaskId: null,
    reviewerTaskId: null,
    verifierRan: false,
    reviewPasses: 0,
    reviewFixCycles: 0,
    verifyRepairCycles: 0,
    lastReviewClean: false,
    lastFastCheckPassed: false,
    committed: false,
    firstReviewBeforeCommit: null,
    askUserOpen: false,
    blockedReason: null,
    ...extra,
  };
}

export function decideWorkers(plan = {}) {
  const surfaces = Array.isArray(plan.surfaces) ? plan.surfaces : [];
  if (surfaces.length < 2) return 1;
  if (plan.layeredDependency) return 1;
  if (!plan.independent) return 1;
  if (!plan.bothStartImmediately) return 1;
  if ((plan.sharedFiles || []).length) return 1;
  if (!plan.wallClockAdvantage) return 1;
  return Math.min(2, surfaces.length);
}

export function classifyAmbiguity(input = {}) {
  if (input.repositoryResolves) return { action: "implement", askUser: false, reason: "repository evidence resolves the ticket" };
  const interpretations = Array.isArray(input.productInterpretations) ? input.productInterpretations : [];
  if (interpretations.length >= 2 && !input.establishedBehavior) {
    return { action: "ask-user", askUser: true, reason: "material product ambiguity with no established behavior" };
  }
  return { action: "implement", askUser: false, reason: "no material product decision remains" };
}

export function fingerprintRisks({ paths = [], diff = "" } = {}) {
  const haystack = `${paths.join("\n")}\n${diff}`;
  const risks = RISK_RULES.filter((rule) => rule.re.test(haystack)).map((rule) => rule.risk);
  const unique = [...new Set(risks)];
  return unique.length ? unique : ["localized"];
}

export function reviewModeForRisks(risks = []) {
  const deep = new Set(["authorization", "schema", "public-contract", "queues", "external-api"]);
  return risks.some((risk) => deep.has(risk)) ? "deep" : "fast";
}

export function buildReviewInput({
  ticket,
  acceptanceCriteria,
  diff,
  checks,
  fastCheckOutput,
  implementerNarrative,
} = {}) {
  if (!ticket || !Array.isArray(acceptanceCriteria) || diff == null || !Array.isArray(checks)) {
    throw new Error("review input requires ticket, acceptanceCriteria, diff, and checks");
  }
  const input = { ticket, acceptanceCriteria, diff, checks };
  if (fastCheckOutput !== undefined) input.fastCheckOutput = fastCheckOutput;
  if (implementerNarrative) input.implementerNarrativeOptional = true;
  return input;
}

function fail(message) {
  const error = new Error(message);
  error.code = "LOOP_VIOLATION";
  throw error;
}

export function applyEvent(ledger, event = {}) {
  const next = {
    ...ledger,
    events: [...ledger.events, event],
  };
  const type = String(event.type || "");
  const agent = String(event.agent || "");

  if (next.mode === "auto" && (FORBIDDEN_AUTO_AGENTS.includes(agent) || type === "grill" || type === "auto-responder")) {
    fail("auto mode must not invoke griller or auto-responder");
  }

  switch (type) {
    case "prepare":
      if (!["IDLE", "PREFLIGHT", "PREPARING"].includes(next.phase)) fail(`prepare is not valid in ${next.phase}`);
      next.phase = "PREPARING";
      if (event.workers) next.workers = Number(event.workers);
      break;
    case "ask-user":
      next.askUserOpen = true;
      next.phase = "ASK_USER";
      break;
    case "resolve-user":
      next.askUserOpen = false;
      next.phase = "PREPARING";
      break;
    case "implement":
      if (next.askUserOpen) fail("implementation must not start while a user question is open");
      if (!["PREPARING", "IMPLEMENTING", "REVIEWING", "VERIFYING"].includes(next.phase)) {
        fail(`implement is not valid in ${next.phase}`);
      }
      if (event.workers !== undefined) next.workers = Number(event.workers);
      if (next.workers > 1) {
        if (!event.parallel) fail("parallel workers require an independence justification");
        if (decideWorkers(event.parallel) !== next.workers) fail("worker count is not justified by independence rules");
      }
      next.phase = "IMPLEMENTING";
      next.lastReviewClean = false;
      next.lastFastCheckPassed = false;
      next.committed = false;
      if (event.taskId) next.implementerTaskId = event.taskId;
      if (event.committed) fail("implementation must not commit before review");
      break;
    case "fast-check":
      if (next.phase !== "IMPLEMENTING" && next.phase !== "CHECKING") fail(`fast-check is not valid in ${next.phase}`);
      next.phase = "CHECKING";
      next.lastFastCheckPassed = event.passed !== false;
      if (!next.lastFastCheckPassed) fail("fast checks failed");
      break;
    case "review": {
      if (next.phase !== "CHECKING" && next.phase !== "REVIEWING") fail("review requires passing fast checks first");
      if (!next.lastFastCheckPassed) fail("review requires passing fast checks");
      next.phase = "REVIEWING";
      next.reviewPasses += 1;
      if (next.reviewPasses > MAX_REVIEW_PASSES) fail("review loop exceeded bounded passes");
      if (event.taskId) next.reviewerTaskId = event.taskId;
      if (next.firstReviewBeforeCommit === null) next.firstReviewBeforeCommit = !next.committed && event.committed !== true;
      if (event.committed) fail("first review must run against an uncommitted diff");
      const findings = Number(event.findings || 0);
      const mechanical = event.mechanical === true;
      next.lastReviewClean = findings === 0;
      if (findings > 0 && !mechanical && next.reviewFixCycles >= MAX_REVIEW_FIX_CYCLES) {
        next.phase = "BLOCKED";
        next.blockedReason = event.blockedReason || "review findings remain after two correction cycles";
        break;
      }
      if (findings > 0 && !mechanical) next.lastReviewClean = false;
      break;
    }
    case "fix":
      if (next.phase !== "REVIEWING" && next.phase !== "VERIFYING" && next.phase !== "CHECKING") {
        fail(`fix is not valid in ${next.phase}`);
      }
      if (next.implementerTaskId && event.resume === false) fail("repair must resume the original implementer when available");
      if (next.implementerTaskId && event.resume !== true && event.freshRepairer !== true) {
        fail("repair must resume the original implementer when available");
      }
      if (next.phase === "VERIFYING" || event.from === "verify") next.verifyRepairCycles += 1;
      else next.reviewFixCycles += 1;
      if (next.reviewFixCycles > MAX_REVIEW_FIX_CYCLES || next.verifyRepairCycles > MAX_VERIFY_REPAIR_CYCLES) {
        next.phase = "BLOCKED";
        next.blockedReason = "correction cycles exhausted";
        break;
      }
      next.phase = "IMPLEMENTING";
      next.lastReviewClean = event.mechanical === true ? next.lastReviewClean : false;
      next.lastFastCheckPassed = false;
      next.committed = false;
      break;
    case "commit":
      if (!next.lastReviewClean) fail("commit requires a clean review");
      if (!next.lastFastCheckPassed) fail("commit requires passing fast checks");
      next.committed = true;
      break;
    case "verify":
      if (!next.lastReviewClean) fail("verification requires a clean review");
      if (!next.committed) fail("verification requires a review-clean commit");
      if (next.phase === "VERIFYING" && !next.lastReviewClean) fail("verification repair must be reviewed before another verify");
      next.phase = "VERIFYING";
      next.verifierRan = true;
      if (event.passed === false) {
        next.lastReviewClean = false;
        next.committed = false;
        next.reviewPasses = 0;
        next.reviewFixCycles = 0;
      } else {
        next.phase = "READY";
      }
      break;
    case "ready":
      if (next.phase !== "READY") fail("ready requires successful real verification");
      break;
    case "blocked":
      next.phase = "BLOCKED";
      next.blockedReason = event.reason || next.blockedReason;
      break;
    default:
      fail(`unknown loop event: ${type}`);
  }
  return next;
}

export function validateLedger(ledger) {
  const errors = [];
  if (ledger.mode === "auto") {
    for (const event of ledger.events) {
      if (FORBIDDEN_AUTO_AGENTS.includes(event.agent) || event.type === "grill" || event.type === "auto-responder") {
        errors.push("auto mode invoked griller or auto-responder");
      }
    }
  }
  if (ledger.workers !== 1 && decideWorkers(ledger.events.find((event) => event.parallel)?.parallel || {}) !== ledger.workers) {
    if (ledger.workers > 1) errors.push("worker count is not justified");
  }
  if (ledger.firstReviewBeforeCommit === false) errors.push("implementation was committed before the first review");
  if (ledger.phase === "READY" && !ledger.verifierRan) errors.push("ready without real verification");
  return { valid: errors.length === 0, errors };
}

export function loopFile(dir) {
  return path.join(dir, "loop.json");
}

async function loadLedger(root) {
  const active = await locateActiveRoot(root);
  if (!active) throw new Error("engineering loop requires an active run");
  const dir = runDir(active.root, active.runId);
  try {
    return { dir, ledger: await json(loopFile(dir)) };
  } catch (error) {
    if (error.code === "ENOENT") return { dir, ledger: emptyLedger() };
    throw error;
  }
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isMain) {
  const [command, ...raw] = process.argv.slice(2);
  const args = {};
  for (let index = 0; index < raw.length; index += 1) {
    if (!raw[index].startsWith("--")) continue;
    const key = raw[index].slice(2);
    const next = raw[index + 1];
    args[key] = next && !next.startsWith("--") ? (index += 1, next) : true;
  }
  const root = path.resolve(String(args.root || process.cwd()));
  try {
    if (command === "init") {
      const active = await locateActiveRoot(root);
      if (!active) throw new Error("init requires an active run");
      const dir = runDir(active.root, active.runId);
      const ledger = emptyLedger({ workers: Number(args.workers || 1) });
      await mkdir(dir, { recursive: true });
      await writeFile(loopFile(dir), `${JSON.stringify(ledger, null, 2)}\n`);
      console.log(JSON.stringify(ledger, null, 2));
    } else if (command === "record") {
      const { dir, ledger } = await loadLedger(root);
      const event = args.file ? JSON.parse(await readFile(path.resolve(String(args.file)), "utf8")) : JSON.parse(String(args.event || "{}"));
      const next = applyEvent(ledger, event);
      await writeFile(loopFile(dir), `${JSON.stringify(next, null, 2)}\n`);
      console.log(JSON.stringify(next, null, 2));
    } else if (command === "validate") {
      const { ledger } = await loadLedger(root);
      const result = validateLedger(ledger);
      console.log(JSON.stringify({ ...result, ledger }, null, 2));
      if (!result.valid) process.exitCode = 1;
    } else if (command === "show") {
      console.log(JSON.stringify((await loadLedger(root)).ledger, null, 2));
    } else {
      throw new Error("usage: engineering-loop.mjs init|record|validate|show");
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
