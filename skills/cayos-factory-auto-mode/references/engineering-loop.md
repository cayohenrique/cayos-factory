# Engineering loop

Auto mode is an iterative engineering loop, not a grill-and-approve workflow.

```text
PREPARE → IMPLEMENT → FAST CHECKS → REVIEW ↔ FIX → COMMIT → REAL VERIFY → PR
```

Every agent call must produce code, discover information needed to produce code, challenge code, or prove behavior.

## Record the loop

```text
node $P/scripts/engineering-loop.mjs init --root $R
node $P/scripts/engineering-loop.mjs record --root $R --event '<json>'
node $P/scripts/engineering-loop.mjs validate --root $R
```

The ledger rejects griller/auto-responder, commit-before-review, verify-before-clean-review, and verify-again after a failed verify without a fresh review.

## Agents and models

- Implement: `taskModelForComplexity` (`small` / `medium` / `large`)
- Review: one `cayos-reviewer` on `taskModelForReview("fast"|"deep")` from the **diff** risk fingerprint
- Verify: project verifier; browser seam requires browser evidence
- Repair: Task `resume` of the original implementer; fresh `cayos-repairer` only if resume is unavailable

Do not launch `cayos-griller` or `cayos-auto-responder`.

## Workers

Default `workers = 1`. Use two only when surfaces are independent, both can start immediately, they do not share files, and parallelism saves wall-clock time. Layered work (migration → service → API) is one worker. Extra git worktrees only for true parallel checkouts.

## Review inputs

Pass ticket snapshot, acceptance criteria, `git diff` / `git diff --cached`, changed files, and fast-check output. Do not make the implementer's narrative the reviewer's worldview. `context.md` is optional pull-based context.

After any material production-code change from review or verification, review again. Mechanical-only edits (comments, formatting) may skip re-review.

## Commit

Commit after fast checks + clean review. If verification repair changes code, review again, then amend or add a commit, then verify again.

## Report

Write a delivery report: what changed, fast checks, review passes/findings, real verification action+result, remaining risks. Do not dump every internal state transition.
