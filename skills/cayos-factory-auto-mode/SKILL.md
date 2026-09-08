---
name: cayos-factory-auto-mode
description: Autonomous engineering loop: prepare, implement, fast checks, adversarial review, real verification, optional PR.
disable-model-invocation: true
---

# Cayos Factory Auto Mode

Invoke only as `/cayos-factory-auto-mode ticket <reference>`. Never auto-trigger.

Read [../cayos-mode/references/commands.md](../cayos-mode/references/commands.md) and [../cayos-mode/references/subagent-execution.md](../cayos-mode/references/subagent-execution.md). Stay in the current Cursor workspace. This is the autonomous loop. `/cayos-mode` is the gated alternative.

Do **not** invoke `cayos-griller` or `cayos-auto-responder`. Ask the user only for material product ambiguity that repository evidence cannot resolve.

## Flow

1. Doctor full; stop unless READY. `run-state init --mode auto`. Resolve the ticket read-only, snapshot it, checkpoint. `engineering-loop init`.
2. `run-state auto-advance --to PREPARING`. Explore only what this ticket needs. Write compact `$RUN/context.md` and `$RUN/prepare.md` per [references/prepare.md](references/prepare.md). Default **one** worker, **one** feature branch, no extra worktree.
3. If a real product decision remains, ask the user and stop. Otherwise `auto-advance --to IMPLEMENTING`, create a compact hashed handoff, launch **one** local `cayos-implementer`. Do not commit yet.
4. Run fast checks. Review the uncommitted diff with one `cayos-reviewer` Task (`review(diff, riskFingerprint)`). Findings → resume the original implementer → fast checks → review again. Bound: two fix cycles, then BLOCKED. Commit only after a clean review.
5. `cayos-verify` on the real seam. On failure: resume implementer → fast checks → review → verify. Never skip review after a code change. Then `READY_FOR_PR`, report, ask for `pullRequest` approval.

See [references/engineering-loop.md](references/engineering-loop.md). Never weaken verification or PR gates.
