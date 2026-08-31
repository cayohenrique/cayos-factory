#!/usr/bin/env node
import path from "node:path";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFile, readdir, stat } from "node:fs/promises";
import { writeJson } from "./lib.mjs";

const raw = process.argv.slice(2);
const values = (name) => raw.flatMap((item, index) => item === `--${name}` && raw[index + 1] ? [raw[index + 1]] : []);
const value = (name) => values(name).at(-1) || "";
const primary = path.resolve(value("root") || process.cwd());
const requested = [primary, ...values("related").map((item) => path.resolve(item))];
const output = value("output") ? path.resolve(value("output")) : "";
const ignored = new Set([".git", "node_modules", "vendor", "dist", "build", ".next", ".nuxt", "coverage", ".cayos/runs"]);
const documentationNames = /^(?:agents|context|readme|contributing|architecture|standards?|styleguide|code[-_ ]?style|patterns?|decisions?|adr(?:-\d+)?)\.(?:md|mdx|txt)$/i;
const documentationPath = /(?:^|\/)(?:docs?|architecture|adr|adrs|decisions|standards?|\.cursor\/rules)(?:\/|$)/i;
const terms = /\b(?:coding standards?|code style|architecture|architectural|conventions?|patterns?|dependency direction|boundar(?:y|ies)|best practices?|guidelines?)\b/i;
const extensions = new Map([
  [".ts", "typescript"], [".tsx", "typescript"], [".js", "javascript"], [".jsx", "javascript"], [".mjs", "javascript"], [".cjs", "javascript"],
  [".php", "php"], [".css", "css"], [".java", "java"], [".kt", "kotlin"], [".py", "python"], [".go", "go"], [".rs", "rust"]
]);
const hash = (body) => createHash("sha256").update(body).digest("hex");

function git(root, args, fallback = "") {
  try { return execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim(); }
  catch { return fallback; }
}

async function walk(root, current = root, files = []) {
  if (files.length >= 50000) return files;
  for (const entry of await readdir(current, { withFileTypes: true })) {
    const target = path.join(current, entry.name);
    const relative = path.relative(root, target).replaceAll(path.sep, "/");
    if (entry.isDirectory()) {
      if (ignored.has(entry.name) || ignored.has(relative)) continue;
      await walk(root, target, files);
    } else if (entry.isFile()) files.push(relative);
    if (files.length >= 50000) break;
  }
  return files;
}

async function inspectRepository(requestedRoot, role) {
  const root = path.resolve(git(requestedRoot, ["rev-parse", "--show-toplevel"], requestedRoot));
  if (!(await stat(root)).isDirectory()) throw new Error(`not a directory: ${root}`);
  const files = await walk(root);
  const languageCounts = {};
  const standards = [];
  const configs = [];
  const directories = new Set();
  let packageJson = null;

  for (const relative of files) {
    const ext = path.extname(relative).toLowerCase();
    const language = extensions.get(ext);
    if (language) languageCounts[language] = (languageCounts[language] || 0) + 1;
    const parts = relative.split("/");
    for (let index = 1; index < parts.length; index++) directories.add(parts.slice(0, index).join("/"));
    const basename = path.basename(relative);
    if (/^(?:package\.json|tsconfig(?:\.[^.]+)?\.json|composer\.json|phpstan(?:\.neon(?:\.dist)?)?|phpunit\.xml(?:\.dist)?|\.php-cs-fixer(?:\.dist)?\.php|pint\.json|eslint\.config\.[^.]+|\.eslintrc(?:\..+)?|prettier\.config\.[^.]+|\.prettierrc(?:\..+)?|stylelint\.config\.[^.]+|tailwind\.config\.[^.]+)$/i.test(basename)) configs.push(relative);
    if (relative === "package.json") {
      try { packageJson = JSON.parse(await readFile(path.join(root, relative), "utf8")); } catch {}
    }
    if (!documentationNames.test(basename) && !documentationPath.test(relative)) continue;
    const file = path.join(root, relative);
    if ((await stat(file)).size > 512000) continue;
    const body = await readFile(file, "utf8");
    if (documentationNames.test(basename) || terms.test(body)) {
      const headings = [...body.matchAll(/^#{1,3}\s+(.+)$/gm)].slice(0, 12).map((match) => match[1].trim());
      standards.push({ path: relative, sha256: hash(body), headings, matchedTerms: terms.test(body) });
    }
  }

  const deps = { ...(packageJson?.dependencies || {}), ...(packageJson?.devDependencies || {}) };
  const frameworks = ["next", "react", "vue", "nuxt", "@angular/core", "express", "fastify", "nestjs", "@nestjs/core", "laravel", "symfony", "tailwindcss"].filter((name) => deps[name]);
  const directoryList = [...directories];
  const evidence = (pattern) => directoryList.filter((item) => pattern.test(item)).slice(0, 20);
  const architectureSignals = [
    { pattern: "layered", evidence: evidence(/(?:^|\/)(?:controllers?|services?|repositories?|models?)(?:\/|$)/i) },
    { pattern: "clean-or-hexagonal", evidence: evidence(/(?:^|\/)(?:domain|application|infrastructure|adapters?|ports?|use[-_]?cases?)(?:\/|$)/i) },
    { pattern: "feature-modular", evidence: evidence(/(?:^|\/)(?:features?|modules?|domains?)(?:\/|$)/i) },
    { pattern: "event-driven", evidence: evidence(/(?:^|\/)(?:events?|listeners?|consumers?|producers?|queues?|workers?)(?:\/|$)/i) }
  ].filter((item) => item.evidence.length);

  const flowLayers = [];
  if (frameworks.some((name) => ["next", "react", "vue", "nuxt", "@angular/core"].includes(name)) || languageCounts.css) flowLayers.push("User interface");
  if (evidence(/(?:^|\/)(?:routes?|controllers?|api)(?:\/|$)/i).length) flowLayers.push("Routes / controllers");
  if (evidence(/(?:^|\/)(?:services?|use[-_]?cases?|application)(?:\/|$)/i).length) flowLayers.push("Application services");
  if (evidence(/(?:^|\/)(?:domain|models?|entities?)(?:\/|$)/i).length) flowLayers.push("Domain model");
  if (evidence(/(?:^|\/)(?:repositories?|persistence|database|db|infrastructure)(?:\/|$)/i).length) flowLayers.push("Persistence / integrations");
  if (!flowLayers.length) flowLayers.push("Entrypoint", "Application behavior", "Observable result");

  const remote = git(root, ["remote", "get-url", "origin"], null);
  return {
    role, repository: remote || path.basename(root), root: role === "primary" ? "." : path.basename(root), remote,
    head: git(root, ["rev-parse", "HEAD"], "unborn"),
    filesScanned: files.length, truncated: files.length >= 50000,
    languages: Object.entries(languageCounts).sort((a, b) => b[1] - a[1]).map(([name, files]) => ({ name, files })),
    frameworks, configs: [...new Set(configs)].sort(), standards: standards.sort((a, b) => a.path.localeCompare(b.path)),
    architectureSignals, flowLayers
  };
}

const unique = [...new Set(requested)];
const repositories = [];
for (const [index, repo] of unique.entries()) repositories.push(await inspectRepository(repo, index === 0 ? "primary" : "related"));
const activeLanguages = [...new Set(repositories.flatMap((repo) => repo.languages.map((item) => item.name)))];
const fallbackStandards = activeLanguages.filter((name) => ["typescript", "javascript", "php", "css"].includes(name));
if (repositories.some((repo) => repo.frameworks.includes("tailwindcss") || repo.configs.some((file) => /tailwind/i.test(file)))) fallbackStandards.push("tailwind");
const report = {
  version: 1, generatedAt: new Date().toISOString(), readOnlyDiscovery: true,
  repositories, activeLanguages, fallbackStandards: [...new Set(fallbackStandards)],
  approvalRequired: {
    standards: "Confirm which discovered documents are authoritative and whether missing stack standards may be created from plugin baselines.",
    architecture: "Confirm the corrected diagram and whether observed architecture should be followed by default."
  }
};
if (output) await writeJson(output, report);
console.log(JSON.stringify(report, null, 2));
