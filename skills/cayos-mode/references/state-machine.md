# State machine

Use `scripts/run-state.mjs` for every transition. Approval commands are nonce-bearing and exact. `BLOCKED` may only return to the interrupted state or abort, never skip a gate. Terminal states clear local and shared active pointers. Checkpoint expected main/worktree HEAD and dirty fingerprints after intentional orchestrator changes.
