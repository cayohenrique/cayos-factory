---
name: cayos-factory-auto-mode
description: Run Cayos ticket delivery with an automated grill-with-docs loop between a griller and an advanced responder subagent.
disable-model-invocation: true
---

# Cayos Factory Auto Mode

Invoke only as `/cayos-factory-auto-mode ticket <reference>`. Never auto-trigger.

This skill wraps `cayos-mode` and replaces manual approval Q&A before `IMPLEMENTING` with a two-subagent grill loop. Pull-request approval still requires an explicit user message.

## Models

Bind in `.cayos/local.json`:

- `griller` — fast model for `cayos-griller` (questions, doc citations).
- `autoResponder` — advanced model for `cayos-auto-responder` (grounded answers).

## Flow

1. Run Doctor full; stop unless READY. Initialize with `node ${CURSOR_PLUGIN_ROOT}/scripts/run-state.mjs init --root <repo> --run-id <id> --ticket <ref> --mode auto`.
2. Follow `cayos-mode` through ticket resolution and snapshotting.
3. For each pre-implementation gate (`sharedUnderstanding`, `testSeam`, `ticketPlan`, `implementation`):
   - produce the gate proposal artifact (`cayos-understand` / `cayos-plan` as appropriate);
   - `run-state propose`;
   - launch **griller** via Task using `local.models.griller` and [references/grill-with-docs.md](references/grill-with-docs.md);
   - for each question, launch **responder** via Task using `local.models.autoResponder` and [references/auto-responder.md](references/auto-responder.md);
   - repeat until the griller converges the transcript;
   - close with `run-state auto-approve` per [references/auto-approval.md](references/auto-approval.md).
4. From `IMPLEMENTING` onward, continue `cayos-mode` unchanged (worktrees, review, verify, PR). Ask the user only for `pullRequest` approval.

Never skip `propose`, grill convergence, or `auto-approve`. Never weaken verification or evidence guards.
