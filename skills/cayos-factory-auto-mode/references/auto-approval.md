# Auto approval

Auto mode closes pre-implementation gates without manual chat approval when a batched grill transcript converges.

## Eligible gates

- `sharedUnderstanding`
- `testSeam`
- `ticketPlan`
- `implementation`

`pullRequest` always requires a real user message via `record-user-message.mjs`.

## Sequence per gate

1. `run-state propose` with the gate proposal artifact.
2. `grill-transcript init`.
3. **Round 1 (required):** one griller Task → `record-questions --round 1`; one responder Task → `record-answers --round 1`.
4. **Round 2 (optional, max one):** only when round 1 ended with `needsFollowUp: true`; one griller Task → `record-questions --round 2`; one responder Task → `record-answers --round 2`.
5. Write a short summary artifact under the active run proposals folder.
6. `grill-transcript converge`, then:

```text
node ${CURSOR_PLUGIN_ROOT}/scripts/run-state.mjs auto-approve --root <repo> --gate <gate> --proposal-file <file> --grill-file <grill.json> --summary-file <summary.md>
```

7. Continue the `cayos-mode` state machine from the new state.

Auto-approve fails when the run is not `autoMode`, the grill is not `CONVERGED`, proposal/grill paths escape the active run, or a round is incomplete.
