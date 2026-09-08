---
name: cayos-mode
description: Controlled ticket delivery with explicit approvals, optional parallel slices, adversarial review, real verification, and optional PR creation.
disable-model-invocation: true
---

# Cayos Mode

Invoke only as `/cayos-mode ticket <reference>`. Never auto-trigger. This is **controlled delivery**. For the autonomous loop use `/cayos-factory-auto-mode`.

Read [references/commands.md](references/commands.md) and [references/subagent-execution.md](references/subagent-execution.md) first. Stay in the current Cursor workspace.

1. Doctor full; stop unless READY. Load relevant standards and `.cayos/architecture.md`. Initialize `PREFLIGHT` (no `--mode auto`).
2. Resolve the provider read-only, snapshot the ticket, checkpoint. Explore once; write compact `$RUN/context.md` per [references/run-context.md](references/run-context.md).
3. Use `cayos-understand` in this chat; exact `sharedUnderstanding` and `testSeam` approvals. Record `verifiableLocally`.
4. Use `cayos-plan` with [../cayos-plan/references/slicing.md](../cayos-plan/references/slicing.md). Default **one** slice. Approve `ticketPlan` and `implementation` before `IMPLEMENTING`.
5. Create a **feature branch** (worktree only if parallel workers or the checkout cannot host the branch). Compact hashed handoff for one worker. Launch local implementer(s). **Do not commit before review.**
6. Fast checks, then `cayos-review` against the uncommitted diff. Material findings → resume the original implementer → fast checks → review again. At most two correction cycles. Commit after a clean review, then `cayos-verify`. Verification failure also returns through fix → review → verify.
7. `READY_FOR_PR`, report, exact `pullRequest` approval. Push/open only in `OPENING_PR`; never merge.

On interruption use `run-state resume`. Read [references/state-machine.md](references/state-machine.md), [references/security.md](references/security.md), and [references/reporting.md](references/reporting.md) when needed.
