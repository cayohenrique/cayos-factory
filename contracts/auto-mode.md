# Auto mode contract

`/cayos-factory-auto-mode` may be invoked only explicitly. Runs initialized with `--mode auto` follow the engineering loop:

`PREPARE → IMPLEMENT → FAST CHECKS → REVIEW ↔ FIX → COMMIT → REAL VERIFY → READY_FOR_PR`

Pre-implementation gates close with `run-state auto-advance` (`TICKET_RESOLVED` → `PREPARING` → `IMPLEMENTING`). No griller, auto-responder, proposal files, or `auto-approve` on the hot path. Pull-request gates still require a captured user message. `auto-advance` rejects non-auto runs.

The run records `$RUN/loop.json` via `engineering-loop.mjs`. The ledger forbids grill agents, commit-before-review, verify-before-clean-review, and a second verify after failure without a fresh review.

Default one implementer and one feature branch. Review is `review(diff, riskFingerprint)` against an uncommitted diff. Material repairs resume the original implementer and must be reviewed again. Real verification still uses the project verifier seam (browser/HTTP/CLI). Manual `/cayos-mode` keeps explicit understanding/plan approvals.

Legacy `auto-approve` plus batched grill transcripts remain valid for non-hot-path use. New auto runs must not create them.
