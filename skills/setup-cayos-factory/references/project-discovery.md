# Project standards and architecture discovery

Use this reference during setup before binding the ticket provider or creating a verifier.

## Scope repositories deliberately

Scan the current Git root, detected workspaces inside it, and only related repositories the user explicitly names or approves. Do not enumerate every repository available through GitHub, an organization, or a local parent folder. Record each repository, role, remote, and HEAD used by the discovery report. Put machine-specific related-repository paths only in `.cayos/local.json` under `relatedRepositories`; committed project policy identifies them by stable ID and remote.

Run:

```text
node ${CURSOR_PLUGIN_ROOT}/scripts/discover-project.mjs --root <repo> [--related <repo>] [--output <report.json>]
```

The script is read-only except for the optional report output. Treat its architecture classification as evidence, not truth.

## Validate existing standards

Inspect reported candidates such as `AGENTS.md`, `CONTEXT.md`, `CONTRIBUTING.md`, ADRs, `docs/`, architecture notes, code-style guides, Cursor rules, linters, formatters, static analysis, and build/test configuration.

For each potentially authoritative source, show:

- repository and path;
- short summary of rules that affect implementation;
- whether code/configuration still supports those rules;
- conflicts, duplication, or signs of staleness;
- a recommendation: accept, reject, or supersede.

Ask the user to approve the set. Do not infer authority merely from a filename, and do not combine conflicting documents silently.

## Propose missing language standards

If an active language or styling system lacks an approved project standard, ask whether to adopt a baseline from `${CURSOR_PLUGIN_ROOT}/assets/standards/`. Load only files matching the detected stack. Existing project conventions win. If approved, copy the selected baseline into `.cayos/standards/<name>.md`; the copied file becomes reviewable project policy. Normalize approved existing rules into `.cayos/standards/project-<slug>.md` with repository/path/HEAD/SHA provenance, without copying irrelevant prose. This makes the effective policy explicit and prevents later ticket agents from rereading every repository. If a source changes, rerun setup to review the new version. If a fallback is rejected, record that decision rather than asking again on every ticket.

## Validate architecture

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

Show the rendered proposal and ask: “Is this description and flow correct? Should Cayos treat this architecture as the default for new work?” Approval means prefer the pattern and require explicit, evidence-backed justification for deviation. It does not prohibit intentional architecture evolution.

## Persist approval

Write every approved source with repository ID, path, decision, and SHA-256; also record copied standards, architecture document, `followByDefault`, approval timestamp, and evidence hashes in `.cayos/project.json` and `.cayos/capabilities.lock.json`. Doctor must resolve related sources only through user-local bindings and block when an approved document changes, disappears, or no longer matches its proof.

## Multi-repository verification

When more than one repository is approved, read [multi-repository.md](multi-repository.md). Ask which repositories need their own verifier, record each under `verification.repositories`, bind related paths in `.cayos/local.json`, and prove one real feature per configured repository during setup.
