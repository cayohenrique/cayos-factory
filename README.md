# Cayos Factory

Cayos Factory is a Cursor plugin that turns a ticket into an approval-gated delivery workflow: resolve, understand, plan, implement in isolated worktrees, review, verify real behavior, and optionally open a PR. Use `/cayos-factory-auto-mode` to automate pre-implementation grill Q&A between a griller subagent and an advanced responder. It never merges, deploys, releases, or mutates the source ticket automatically.

## Install

Add this repository as a Cursor plugin source, then run:

```text
/setup-cayos-factory
/cayos-doctor
/cayos-mode ticket <reference>
/cayos-factory-auto-mode ticket <reference>
```

Setup scans project-approved repositories for existing code standards, asks which documents remain authoritative, proposes stack-specific fallbacks when none exist, maps the observed architecture with Mermaid, and asks whether that pattern should be followed by default. It then binds the ticket provider, delivery/work-tier model policy (not per-agent roles), discovers or creates one verifier per repository boundary, executes a real verification path for each configured repository (browser via `chrome-agent-mcp` when that repository's seam is web UI), and records hashes in `.cayos/capabilities.lock.json`.

## Guarantees

- Explicit invocation only; no accidental auto-trigger.
- Exact user approvals for understanding, test seam, plan, implementation, and PR.
- Immutable ticket snapshots and append-only run journals.
- Repository writes only during `IMPLEMENTING`.
- One registered worktree per implementation slice.
- Small/deep/spec review routing and bounded repair loops.
- Real project verifier with Launch, Doctor, Drive, Evidence, Cleanup, Helpers, and a feature map per configured repository. Web repositories add a Browser section and drive through `chrome-agent-mcp` when their entry uses `seam: "browser"`.
- Push and PR creation only after verification and explicit approval; automatic merge is forbidden.
- Resumable runs reject changed config, HEAD, dirty state, plugin version, ticket revision, and worker drift.

## Project files created by setup

```text
.cayos/project.json              # committed policy
.cayos/local.json                # local provider + delivery/work-tier model policy
.cayos/discovery-report.json     # bounded repository evidence
.cayos/architecture.md           # approved diagrams and boundaries
.cayos/standards/                # approved fallback standards
.cayos/capabilities.lock.json    # proof hashes
.cursor/skills/verify-<project>/ # project verifier
```

Run `npm run verify` to validate the plugin, execute adversarial fixtures, and audit skill token budgets.

See [`contracts/`](contracts/) for provider, verifier, auto-mode, and worker-handoff contracts.
