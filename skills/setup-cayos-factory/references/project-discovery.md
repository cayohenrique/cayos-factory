# Project standards and architecture discovery

Use during setup **after** Phase 1 scope is confirmed and **before** binding the ticket provider or creating verifiers. User-facing prompts: [setup-questions.md](setup-questions.md) Phases 2–3.

## Scope repositories deliberately

Scan the current Git root, detected workspaces inside it, and only related repositories the user explicitly names or approves in Phase 1. When they pick **all git repos in this folder**, scan immediate child checkouts with `--scan-folder` (one kept repo per `origin` remote; duplicate worktrees are collapsed). Do not enumerate every repository available through GitHub, an organization, or a local parent folder outside the approved scan. Record each repository, role, remote, `localPath`, and HEAD used by the discovery report. Put machine-specific related-repository paths only in `.cayos/local.json` under `relatedRepositories`; committed project policy identifies them by stable ID and remote.

Run:

```text
node ${CURSOR_PLUGIN_ROOT}/scripts/discover-project.mjs --root <repo> [--related <repo>] [--output <report.json>]
node ${CURSOR_PLUGIN_ROOT}/scripts/discover-project.mjs --scan-folder <folder> [--primary <repo-path>] [--output <report.json>]
```

The script is read-only except for the optional report output. Treat its architecture classification as evidence, not truth.

## Validate existing standards (Phase 2a)

Inspect reported candidates such as `AGENTS.md`, `CONTEXT.md`, `CONTRIBUTING.md`, ADRs, `docs/`, architecture notes, code-style guides, Cursor rules, linters, formatters, static analysis, and build/test configuration.

For each potentially authoritative source, show:

- repository and path;
- short summary of rules that affect implementation;
- whether code/configuration still supports those rules;
- conflicts, duplication, or signs of staleness;
- a recommendation: accept, reject, or supersede.

Collect per-document decisions using Phase 2a (**Follow** · **Ignore** · **Replace with Cayos baseline**). Do not infer authority merely from a filename, and do not combine conflicting documents silently.

## Propose missing language standards (Phase 2b)

If an active language or styling system lacks an approved project standard, use Phase 2b. Load baselines only from `${CURSOR_PLUGIN_ROOT}/assets/standards/` for the detected stack. Existing project conventions win. If approved, copy the selected baseline into `.cayos/standards/<name>.md`; the copied file becomes reviewable project policy. Normalize approved existing rules into `.cayos/standards/project-<slug>.md` with repository/path/HEAD/SHA provenance, without copying irrelevant prose. This makes the effective policy explicit and prevents later ticket agents from rereading every repository. If a source changes, rerun setup to review the new version. If a fallback is rejected, record that decision rather than asking again on every ticket.

## Validate architecture (Phase 3)

Separate three things:

1. **Declared:** architecture explicitly documented by the project.
2. **Observed:** boundaries and dependency direction supported by entrypoints, imports, folders, runtime/config, storage, messaging, and integrations.
3. **Proposed:** the smallest useful model that reconciles declared and observed evidence.

Do not label a system “clean”, “hexagonal”, “DDD”, “microservices”, or “event-driven” from folder names alone. Cite concrete paths and dependency evidence. Call out drift rather than hiding it.

Create `.cayos/architecture.md` containing:

- scope and repositories;
- declared and observed architecture;
- contradictions/unknowns;
- a compact Mermaid container diagram;
- a Mermaid sequence or top-down flowchart for the main user path;
- boundaries and dependency direction new work should preserve;
- evidence paths and HEADs.

Ask Phase 3a (accuracy) and Phase 3b (default for new work) separately. Approval means prefer the pattern and require explicit, evidence-backed justification for deviation. It does not prohibit intentional architecture evolution.

## Persist approval

Write every approved source with repository ID, path, decision, and SHA-256; also record copied standards, architecture document, `followByDefault`, approval timestamp, and evidence hashes in `.cayos/project.json` and `.cayos/capabilities.lock.json`. Doctor must resolve related sources only through user-local bindings and block when an approved document changes, disappears, or no longer matches its proof.

## Multi-repository verification

When more than one repository is approved, read [multi-repository.md](multi-repository.md). Use Phase 6 for proof type and example path; record each repository under `verification.repositories`, bind related paths in `.cayos/local.json`, and prove one real feature per configured repository during setup.
