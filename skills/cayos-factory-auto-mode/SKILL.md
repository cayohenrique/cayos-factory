---
name: cayos-factory-auto-mode
description: Run Cayos ticket delivery with one paired grill per phase (understanding, plan), parallel slices, and pipelined review.
disable-model-invocation: true
---

# Cayos Factory Auto Mode

Invoke only as `/cayos-factory-auto-mode ticket <reference>`. Never auto-trigger.

Read [../cayos-mode/references/commands.md](../cayos-mode/references/commands.md) and [../cayos-mode/references/subagent-execution.md](../cayos-mode/references/subagent-execution.md). Do not read plugin scripts, agents, contracts, or tests to learn usage. Stay in the current Cursor workspace for the whole run.

This skill wraps `cayos-mode`. Pre-implementation gates close through **two** batched grill phases instead of four, each with a paired griller and responder. Pull-request approval still requires the exact user message.

Grill subagents follow [references/final-feature-bar.md](references/final-feature-bar.md): final production feature unless the ticket explicitly says MVP/prototype/spike/POC.

## Models

- `models.subagents.grillInterviewer` → `cayos-griller`
- `models.subagents.grillInterviewee` → `cayos-auto-responder`

If a slug fails to launch, relaunch without `model` and note it in the report. Never turn a config problem into a grill question.

## Flow

1. Doctor full; stop unless READY. `run-state init --mode auto`. Resolve the ticket read-only, snapshot it, checkpoint.
2. Explore once and write `$RUN/context.md` per [../cayos-mode/references/run-context.md](../cayos-mode/references/run-context.md). Every Task prompt from here on starts with "Read `$RUN/context.md` first; explore only its gaps."
3. **Phase A (understanding + seam).** Write one `understanding-brief.md` with the `cayos-understand` content **and** the test seam section (including `verifiableLocally`). Then:
   - `propose --gate sharedUnderstanding`; `grill-transcript init --gate sharedUnderstanding --gates sharedUnderstanding,testSeam`;
   - round 1: one griller Task ([references/grill-with-docs.md](references/grill-with-docs.md)) → `record-questions --round 1`; one responder Task ([references/auto-responder.md](references/auto-responder.md)) → `record-answers --round 1`;
   - round 2 only when round 1 set `needsFollowUp: true` (at most once);
   - summary, `converge`, `auto-approve --gate sharedUnderstanding`; then `propose --gate testSeam` with the same brief and `auto-approve --gate testSeam` with the same grill file.
4. **Phase B (plan + implementation scope).** Write one `plan-brief.md` with the `cayos-plan` spec, slices per [../cayos-plan/references/slicing.md](../cayos-plan/references/slicing.md), shared contract, review route per slice, and implementation scope/models. Same grill sequence with `--gate ticketPlan --gates ticketPlan,implementation`, then `auto-approve` for `ticketPlan` and `implementation`.
5. From `IMPLEMENTING` onward follow `cayos-mode` steps 5 to 8: create all branches/worktrees and handoffs up front, launch every slice at once, review each slice as it lands, repair by resuming the original implementer, verify, report, ask for `pullRequest` approval.

Never skip `propose`, grill convergence, or `auto-approve`. Never weaken verification or evidence guards. See [references/auto-approval.md](references/auto-approval.md) for the exact gate sequence.
