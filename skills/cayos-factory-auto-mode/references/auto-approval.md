# Auto approval (legacy)

`/cayos-factory-auto-mode` does **not** grill or auto-approve pre-implementation gates. It uses `run-state auto-advance` from `TICKET_RESOLVED` → `PREPARING` → `IMPLEMENTING`.

`pullRequest` still requires the exact user `approvalCommand`.

## Current auto-mode commands

```text
node $P/scripts/run-state.mjs auto-advance --root $R --to PREPARING
node $P/scripts/run-state.mjs auto-advance --root $R --to IMPLEMENTING
```

`auto-advance` rejects non-auto runs and skips proposal files, grill transcripts, and extra LLM gates.

## Legacy grill auto-approve

`run-state auto-approve` and `grill-transcript` remain for `/cayos-mode` experiments or an explicit grill request. They are not on the auto-mode hot path.

`auto-approve` still requires auto mode, a converged grill whose `gates` include the requested gate, and matching proposal hashes.
