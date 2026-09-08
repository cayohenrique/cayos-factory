# State machine

Use `scripts/run-state.mjs` for every transition. Approval commands are nonce-bearing and exact. `BLOCKED` may only return to the interrupted state or abort.

Auto mode observable path: `PREFLIGHT` → `TICKET_RESOLVED` → `PREPARING` → `IMPLEMENTING` → `REVIEWING` → `VERIFYING` → `READY_FOR_PR` → `OPENING_PR` → `DONE`. Manual mode still uses understanding/plan approval states.

`VERIFYING` may return to `IMPLEMENTING` or `REVIEWING` after a failed real verification. Terminal states clear active pointers. Checkpoint HEAD and dirty fingerprints after intentional changes, including uncommitted review diffs.
