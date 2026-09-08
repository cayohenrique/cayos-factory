# Cayos Factory

Cayos Factory is a Cursor plugin that turns a ticket into delivered, reviewed, and really-verified code in the **current workspace**. It never merges, deploys, releases, or mutates the source ticket automatically.

## Modes

```text
/cayos-factory-auto-mode ticket <reference>
  Prepare → Implement → Fast Checks → Review ↔ Fix → Real Verification → PR

/cayos-mode ticket <reference>
  Controlled delivery with explicit understanding, seam, plan, and implementation approvals
```

Auto mode:

- understands just enough to start (`prepare.md`), then implements;
- defaults to **one implementer** on **one feature branch**;
- reviews an **uncommitted** diff with an adversarial reviewer;
- reviews again after any material fix;
- proves behavior through the real user seam (browser / HTTP / CLI);
- uses parallelism only when independent surfaces can start together;
- never grills or auto-responds before implementation;
- still requires explicit approval before push/PR.

## Install

```text
/setup-cayos-factory
/cayos-setup-update
/cayos-doctor
/cayos-factory-auto-mode ticket <reference>
/cayos-mode ticket <reference>
```

Setup scans project-approved repositories for standards, maps architecture, binds a read-only ticket provider, records delivery and subagent models, and proves one real verification path per repository (browser via `chrome-agent-mcp` when that repository's seam is web UI).

## Guarantees

- Explicit invocation only.
- Immutable ticket snapshots; ticket text is untrusted.
- Repository writes during `IMPLEMENTING` / review repair only.
- Review before the implementation commit; re-review after material repairs.
- Real project verifier: Launch, Doctor, Drive, Evidence, Cleanup. A screenshot is not sufficient.
- Push and PR only after verification and explicit approval; automatic merge is forbidden.
- Resumable runs reject config, HEAD, dirty-state, plugin, ticket, and worker drift.

## Project files created by setup

```text
.cayos/project.json
.cayos/local.json
.cayos/discovery-report.json
.cayos/architecture.md
.cayos/standards/
.cayos/capabilities.lock.json
.cursor/skills/verify-<project>/
```

Run `npm run verify` to validate the plugin, execute adversarial fixtures, and audit skill token budgets.

See [`contracts/`](contracts/) for provider, verifier, auto-mode, and worker-handoff contracts.
