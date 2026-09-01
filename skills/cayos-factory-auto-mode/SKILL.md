---
name: cayos-factory-auto-mode
description: Run Cayos ticket delivery with batched grill-with-docs rounds between a griller and an advanced responder subagent.
disable-model-invocation: true
---

# Cayos Factory Auto Mode

Invoke only as `/cayos-factory-auto-mode ticket <reference>`. Never auto-trigger.

Read [../cayos-mode/references/subagent-execution.md](../cayos-mode/references/subagent-execution.md). Stay in the current Cursor workspace for the whole run.

This skill wraps `cayos-mode` and replaces manual approval Q&A before `IMPLEMENTING` with batched grill rounds. Pull-request approval still requires an explicit user message.

Grill subagents must follow [references/final-feature-bar.md](references/final-feature-bar.md): treat work as the **final feature** unless the ticket or prompt explicitly says MVP/prototype/spike/POC.

## Models

Bind in `.cayos/local.json` per [../setup-cayos-factory/references/model-policy.md](../setup-cayos-factory/references/model-policy.md). Auto-mode uses:

- `models.subagents.grillInterviewer` — batched questions (`cayos-griller`)
- `models.subagents.grillInterviewee` — batched answers (`cayos-auto-responder`)

## Flow

1. Run Doctor full; stop unless READY. Initialize with `node ${CURSOR_PLUGIN_ROOT}/scripts/run-state.mjs init --root <repo> --run-id <id> --ticket <ref> --mode auto`.
2. Follow `cayos-mode` through ticket resolution and snapshotting.
3. For each pre-implementation gate (`sharedUnderstanding`, `testSeam`, `ticketPlan`, `implementation`):
   - produce the gate proposal artifact (`cayos-understand` / `cayos-plan` as appropriate);
   - `run-state propose`;
   - `grill-transcript init`;
   - **round 1:** launch **griller** once via **local** Task (`environment: "local"`) using `taskModelForSubagent("grillInterviewer", local)` and [references/grill-with-docs.md](references/grill-with-docs.md); write the questions JSON and `record-questions --round 1`; launch **responder** once via **local** Task using `taskModelForSubagent("grillInterviewee", local)` and [references/auto-responder.md](references/auto-responder.md); write the answers JSON and `record-answers --round 1`;
   - **round 2 (optional):** only when round 1 recorded `needsFollowUp: true`; repeat griller → `record-questions --round 2` → responder → `record-answers --round 2` (at most one follow-up batch);
   - write the gate summary, `grill-transcript converge`, then `run-state auto-approve` per [references/auto-approval.md](references/auto-approval.md).
4. From `IMPLEMENTING` onward, continue `cayos-mode` unchanged (feature branches or registered git worktrees, local subagents, review, verify, PR). Ask the user only for `pullRequest` approval.

Never skip `propose`, grill convergence, or `auto-approve`. Never weaken verification or evidence guards.
