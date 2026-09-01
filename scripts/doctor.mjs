#!/usr/bin/env node
import path from "node:path";
import { createHash } from "node:crypto";
import { access, lstat, readFile, readdir, realpath } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { normalizeVerification, normalizeVerifierProof, validateVerificationConfig } from "./verification.mjs";
import { validateModelPolicy } from "./models.mjs";

const raw = process.argv.slice(2);
const rootIndex = raw.indexOf("--root");
const root = path.resolve(rootIndex >= 0 ? raw[rootIndex + 1] : process.cwd());
const rootReal = await realpath(root);
const full = raw.includes("--full");
const checks = [];
const add = (name, status, detail) => checks.push({ name, status, detail });
const hash = (value) => createHash("sha256").update(value).digest("hex");
const inside = (candidate, parent) => candidate === parent || candidate.startsWith(`${parent}${path.sep}`);

async function safePath(base, relative, label) {
  const baseReal = await realpath(base);
  const target = path.resolve(baseReal, String(relative || ""));
  if (!inside(target, baseReal)) throw new Error(`${label} escapes the approved repository`);
  const segments = path.relative(baseReal, target).split(path.sep).filter(Boolean);
  let current = baseReal;
  for (const segment of segments) {
    current = path.join(current, segment);
    const info = await lstat(current);
    if (info.isSymbolicLink()) throw new Error(`${label} contains a symbolic link`);
  }
  const targetReal = await realpath(target);
  if (!inside(targetReal, baseReal)) throw new Error(`${label} resolves outside the approved repository`);
  return targetReal;
}
const projectPath = (relative, label) => safePath(rootReal, relative, label);
const projectRead = async (relative, label) => readFile(await projectPath(relative, label));

async function hashTree(rootPath) {
  const entries = await readdir(rootPath, { withFileTypes: true });
  const parts = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const target = path.join(rootPath, entry.name);
    if ((await lstat(target)).isSymbolicLink()) throw new Error(`proof tree contains symbolic link: ${target}`);
    parts.push(entry.isDirectory() ? `${entry.name}:${await hashTree(target)}` : `${entry.name}:${hash(await readFile(target))}`);
  }
  return hash(parts.join("\n"));
}
async function hashPath(target) {
  const info = await lstat(target);
  if (info.isSymbolicLink()) throw new Error(`proof path is a symbolic link: ${target}`);
  return info.isDirectory() ? hashTree(target) : hash(await readFile(target));
}
function git(base, args, fallback = "") {
  try { return execFileSync("git", args, { cwd: base, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim(); }
  catch { return fallback; }
}

async function repositoryRoot(repositoryId, local) {
  if (repositoryId === "primary") return rootReal;
  const declared = config.repositories.related.find((repo) => repo.id === repositoryId);
  const bound = local?.relatedRepositories?.[repositoryId];
  if (!declared || !bound) throw new Error(`related repository is not locally bound: ${repositoryId}`);
  const sourceRoot = await realpath(bound);
  if (await realpath(git(sourceRoot, ["rev-parse", "--show-toplevel"], sourceRoot)) !== sourceRoot) {
    throw new Error(`related binding is not a Git root: ${repositoryId}`);
  }
  if (declared.remote && git(sourceRoot, ["remote", "get-url", declared.remoteName || "origin"]) !== declared.remote) {
    throw new Error(`related repository remote mismatch: ${repositoryId}`);
  }
  return sourceRoot;
}

const repoPath = async (repositoryId, relative, label, local) => safePath(await repositoryRoot(repositoryId, local), relative, label);
const repoRead = async (repositoryId, relative, label, local) => readFile(await repoPath(repositoryId, relative, label, local));

let config;
let verificationEntries = [];
try {
  config = JSON.parse(await projectRead(".cayos/project.json", "project config"));
  const verification = validateVerificationConfig(config.verification, config);
  verificationEntries = verification.entries;
  const sourcesValid = Array.isArray(config.standards?.sources) && config.standards.sources.every((source) => source.repository && source.path && /^[0-9a-f]{64}$/i.test(String(source.sha256 || "")) && source.decision === "approved");
  const valid = config.version === 2
    && Boolean(config.project?.name)
    && Array.isArray(config.repositories?.related)
    && config.standards?.status === "approved"
    && sourcesValid
    && Array.isArray(config.standards?.fallbacks)
    && Boolean(config.standards?.approvedAt)
    && config.architecture?.status === "approved"
    && Boolean(config.architecture?.document)
    && typeof config.architecture?.followByDefault === "boolean"
    && Boolean(config.architecture?.approvedAt)
    && Boolean(config.ticketProvider?.type)
    && Boolean(config.ticketProvider?.referencePattern)
    && config.ticketProvider?.readOnly === true
    && Boolean(config.codeHost?.type)
    && config.codeHost?.autoMerge === false
    && verification.valid;
  add("project-config", valid ? "PASS" : "FAIL", valid ? `valid v2 contract with ${verificationEntries.length} repository verifier(s)` : verification.errors[0] || "missing, unapproved, or unsafe required fields");
} catch (error) { add("project-config", "FAIL", error.code === "ENOENT" ? "run /setup-cayos-factory" : error.message); }

try {
  const top = await realpath(git(rootReal, ["rev-parse", "--show-toplevel"], rootReal));
  add("git", top === rootReal ? "PASS" : "FAIL", top === rootReal ? "repository root confirmed" : `nested inside ${top}`);
  if (!git(rootReal, ["rev-parse", "--git-common-dir"])) throw new Error("git common directory unavailable");
  add("worktrees", "PASS", "git common directory available");
  if (config?.codeHost?.remote && !git(rootReal, ["remote", "get-url", config.codeHost.remote])) throw new Error(`missing remote ${config.codeHost.remote}`);
} catch (error) { add("git", "FAIL", error.message.split("\n")[0]); }

if (config?.architecture && config?.standards) {
  try {
    await projectPath(config.architecture.document, "architecture document");
    for (const item of config.standards.fallbacks) await projectPath(typeof item === "string" ? item : item.path, "fallback standard");
    add("project-profile", "PASS", `${config.standards.sources.length} source standards, ${config.standards.fallbacks.length} fallbacks, architecture approved`);
  } catch (error) { add("project-profile", "FAIL", error.message); }
}

if (verificationEntries.length) {
  try {
    const local = full ? JSON.parse(await projectRead(".cayos/local.json", "local config")) : {};
    const entries = full ? verificationEntries : verificationEntries.filter((entry) => entry.repository === "primary");
    const failures = [];
    for (const entry of entries) {
      const dir = await repoPath(entry.repository, entry.skill, `verifier skill ${entry.repository}`, local);
      const file = await safePath(dir, "SKILL.md", `verifier entrypoint ${entry.repository}`);
      const body = await readFile(file, "utf8");
      const missing = ["Launch", "Doctor", "Drive", "Evidence", "Cleanup", "Helpers"].filter((section) => !new RegExp(`^## ${section}$`, "m").test(body));
      if (entry.seam === "browser" && !new RegExp("^## Browser$", "m").test(body)) missing.push("Browser");
      try { await safePath(dir, "features/README.md", `verifier feature map ${entry.repository}`); } catch { missing.push("features/README.md"); }
      if (missing.length) failures.push(`${entry.repository}: ${missing.join(", ")}`);
    }
    add("verifier", failures.length ? "FAIL" : "PASS", failures.length ? failures.join("; ") : `${entries.length} checked repository verifier(s) satisfy structural contract`);
  } catch (error) { add("verifier", "FAIL", error.message); }
}

if (full) {
  let local;
  try {
    local = JSON.parse(await projectRead(".cayos/local.json", "local config"));
    const modelCheck = validateModelPolicy(local);
    const provider = config.ticketProvider.binding === "cli"
      ? local.ticketProvider?.kind === "cli" && Array.isArray(local.ticketProvider?.readCommandPatterns) && local.ticketProvider.readCommandPatterns.length && local.ticketProvider.readCommandPatterns.every((pattern) => String(pattern).startsWith("^") && String(pattern).endsWith("$"))
      : local.ticketProvider?.serverName && Array.isArray(local.ticketProvider?.readTools) && local.ticketProvider.readTools.length;
    const browser = !verificationEntries.some((entry) => entry.seam === "browser") || (local.browser?.mcpServer && Number(local.browser?.debugPort) > 0);
    const relatedBound = verificationEntries
      .filter((entry) => entry.repository !== "primary")
      .every((entry) => config.repositories.related.some((repo) => repo.id === entry.repository) && local.relatedRepositories?.[entry.repository]);
    add("local-bindings", modelCheck.valid && provider && browser && relatedBound ? "PASS" : "FAIL", modelCheck.valid && provider && browser && relatedBound ? "model policy, provider, and repository bindings ready" : `missing: ${modelCheck.errors.join(", ") || "model policy"}${verificationEntries.some((entry) => entry.seam === "browser") && !browser ? ", browser" : ""}${!relatedBound ? ", relatedRepositories" : ""}`);
  } catch (error) { add("local-bindings", "FAIL", error.message); }

  try {
    for (const source of config.standards.sources) {
      let sourceRoot = rootReal;
      if (source.repository !== "primary") {
        const declared = config.repositories.related.find((repo) => repo.id === source.repository);
        const bound = local?.relatedRepositories?.[source.repository];
        if (!declared || !bound) throw new Error(`approved related repository is not locally bound: ${source.repository}`);
        sourceRoot = await realpath(bound);
        if (await realpath(git(sourceRoot, ["rev-parse", "--show-toplevel"], sourceRoot)) !== sourceRoot) throw new Error(`related binding is not a Git root: ${source.repository}`);
        if (declared.remote && git(sourceRoot, ["remote", "get-url", declared.remoteName || "origin"]) !== declared.remote) throw new Error(`related repository remote mismatch: ${source.repository}`);
      }
      const current = hash(await readFile(await safePath(sourceRoot, source.path, `approved standard ${source.repository}:${source.path}`)));
      if (current !== source.sha256) throw new Error(`approved standard changed: ${source.repository}:${source.path}`);
    }
    add("standards-sources", "PASS", `${config.standards.sources.length} approved source documents match`);
  } catch (error) { add("standards-sources", "FAIL", error.message); }

  try {
    const proof = JSON.parse(await projectRead(".cayos/capabilities.lock.json", "capability lock"));
    const projectHash = hash(await projectRead(".cayos/project.json", "project config"));
    const localHash = hash(await projectRead(".cayos/local.json", "local config"));
    const proofEntries = normalizeVerifierProof(proof.verifierProof);
    const computedProofs = [];
    for (const entry of verificationEntries) {
      const verifierHash = await hashTree(await repoPath(entry.repository, entry.skill, `verifier skill ${entry.repository}`, local));
      const sourceParts = [];
      for (const source of entry.sourcePaths) sourceParts.push(`${source}:${await hashPath(await repoPath(entry.repository, source, `verification source ${entry.repository}`, local))}`);
      const sourceHash = hash(sourceParts.join("\n"));
      const proofEntry = proofEntries.find((item) => item.repository === entry.repository);
      if (!proofEntry) throw new Error(`missing verifier proof for repository ${entry.repository}`);
      const evidenceHash = hash(await repoRead(entry.repository, proofEntry.evidence, `verification evidence ${entry.repository}`, local));
      computedProofs.push({ repository: entry.repository, verifierHash, sourceHash, evidenceHash, proofEntry });
    }
    const adapterHash = await hashPath(await projectPath(proof.providerContract.adapter, "provider adapter"));
    const discoveryReportHash = hash(await projectRead(proof.discoveryProof.report, "discovery report"));
    const architectureHash = hash(await projectRead(proof.discoveryProof.architecture, "architecture proof"));
    const standardHashes = [];
    for (const standard of proof.discoveryProof.standards || []) standardHashes.push({ path: standard.path, sha256: hash(await projectRead(standard.path, "standard proof")) });
    const standardsMatch = standardHashes.length === (proof.discoveryProof.standards || []).length && standardHashes.every((item, index) => item.path === proof.discoveryProof.standards[index].path && item.sha256 === proof.discoveryProof.standards[index].sha256);
    const verifierMatch = computedProofs.every((item) => item.proofEntry.verifierHash === item.verifierHash && item.proofEntry.sourceHash === item.sourceHash && item.proofEntry.evidenceHash === item.evidenceHash);
    const valid = proof.providerContract?.status === "PASS"
      && proof.providerContract?.contractVersion === 1
      && proof.verifierProof?.status === "PASS"
      && proof.discoveryProof?.status === "PASS"
      && Boolean(proof.checkedAt)
      && proof.projectHash === projectHash
      && proof.localHash === localHash
      && proof.providerContract.adapterHash === adapterHash
      && verifierMatch
      && proofEntries.length === verificationEntries.length
      && proof.discoveryProof.reportHash === discoveryReportHash
      && proof.discoveryProof.architectureHash === architectureHash
      && standardsMatch;
    add("capability-lock", valid ? "PASS" : "FAIL", valid ? `provider, ${verificationEntries.length} verifier proof(s), standards, architecture, and evidence hashes match` : "proof/hash/evidence mismatch");
  } catch (error) { add("capability-lock", "FAIL", `proof path missing or unreadable: ${error.code || error.message}`); }
}

const status = checks.some((check) => check.status === "FAIL") ? "BLOCKED" : checks.some((check) => check.status === "WARN") ? "DEGRADED" : "READY";
console.log(JSON.stringify({ status, root, checks }, null, 2));
process.exitCode = status === "BLOCKED" ? 1 : 0;
