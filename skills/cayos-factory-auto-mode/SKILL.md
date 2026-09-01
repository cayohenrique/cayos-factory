---
name: cayos-factory-auto-mode
description: Run Cayos ticket delivery with an automated grill-with-docs loop between a griller and an advanced responder subagent.
disable-model-invocation: true
---

# Cayos Factory Auto Mode

Invoke only as `/cayos-factory-auto-mode ticket <reference>`. Never auto-trigger.

This skill wraps `cayos-mode` and replaces manual approval Q&A before `IMPLEMENTING` with a two-subagent grill loop. Pull-request approval still requires an explicit user message.

## Models

Bind in `.cayos/local.json` per [../setup-cayos-factory/references/model-policy.md](../setup-cayos-factory/references/model-policy.md):

- `models.delivery` — usually `inherit` (parent chat runs `/cayos-mode`).
- `models.work.fast` — implementation, small review, repair, and grill when auto-mode overrides are omitted.
- `models.work.judgment` — deep/spec review and grounded auto-mode responses when overrides are omitted.
- Optional `models.autoMode.grill` / `models.autoMode.respond` — only when they must differ from the work tiers.

## Flow

1. Run Doctor full; stop unless READY. Initialize with `node ${CURSOR_PLUGIN_ROOT}/scripts/run-state.mjs init --root <repo> --run-id <id> --ticket <ref> --mode auto`.
2. Follow `cayos-mode` through ticket resolution and snapshotting.
3. For each pre-implementation gate (`sharedUnderstanding`, `testSeam`, `ticketPlan`, `implementation`):
   - produce the gate proposal artifact (`cayos-understand` / `cayos-plan` as appropriate);
   - `run-state propose`;
   - launch **griller** via Task using `taskModelForRole("griller", local)` from `scripts/models.mjs` (omit Task `model` when the binding is `inherit`) and [references/grill-with-docs.md](references/grill-with-docs.md);
   - for each question, launch **responder** via Task using `taskModelForRole("autoResponder", local)` and [references/auto-responder.md](references/auto-responder.md);
   - repeat until the griller converges the transcript;
   - close with `run-state auto-approve` per [references/auto-approval.md](references/auto-approval.md).
4. From `IMPLEMENTING` onward, continue `cayos-mode` unchanged (worktrees, review, verify, PR). Ask the user only for `pullRequest` approval.

Never skip `propose`, grill convergence, or `auto-approve`. Never weaken verification or evidence guards.
