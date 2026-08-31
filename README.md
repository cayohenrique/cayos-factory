# Cayos Factory

Cayos Factory is a Cursor plugin that turns a ticket into an approval-gated delivery workflow: resolve, understand, plan, implement in isolated worktrees, review, verify real behavior, and optionally open a PR. It never merges, deploys, releases, or mutates the source ticket automatically.

## Install

Add this repository as a Cursor plugin source, then run:

```text
/setup-cayos-factory
/cayos-doctor
/cayos-mode ticket <reference>
```

Setup asks which skill or MCP reads tickets (ClickUp, Jira, GitHub, Linear, a CLI adapter, or another provider), binds model roles, discovers or creates `verify-<project>`, executes a real verification path, and records hashes in `.cayos/capabilities.lock.json`.

## Guarantees

- Explicit invocation only; no accidental auto-trigger.
- Exact user approvals for understanding, test seam, plan, implementation, and PR.
- Immutable ticket snapshots and append-only run journals.
- Repository writes only during `IMPLEMENTING`.
- One registered worktree per implementation slice.
- Small/deep/spec review routing and bounded repair loops.
- Real project verifier with Launch, Doctor, Drive, Evidence, Cleanup, Helpers, and a feature map.
- Push and PR creation only after verification and explicit approval; automatic merge is forbidden.
- Resumable runs reject changed config, HEAD, dirty state, plugin version, ticket revision, and worker drift.

## Project files created by setup

```text
.cayos/project.json              # committed policy
.cayos/local.json                # local model/provider binding
.cayos/capabilities.lock.json    # proof hashes
.cursor/skills/verify-<project>/ # project verifier
```

Run `npm run verify` to validate the plugin, execute adversarial fixtures, and audit skill token budgets.

See [`contracts/`](contracts/) for provider, verifier, and worker-handoff contracts.
