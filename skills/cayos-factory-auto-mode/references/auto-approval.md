# Auto approval

Auto mode closes pre-implementation gates without manual chat approval when a grill transcript converges.

## Eligible gates

- `sharedUnderstanding`
- `testSeam`
- `ticketPlan`
- `implementation`

`pullRequest` always requires a real user message via `record-user-message.mjs`.

## Sequence per gate

1. `run-state propose` with the gate proposal artifact.
2. Run the grill-with-docs loop (griller → responder) until convergence.
3. Write a short summary artifact under the active run proposals folder.
4. Close the gate:

```text
node ${CURSOR_PLUGIN_ROOT}/scripts/run-state.mjs auto-approve --root <repo> --gate <gate> --proposal-file <file> --grill-file <grill.json> --summary-file <summary.md>
```

5. Continue the `cayos-mode` state machine from the new state.

Auto-approve fails when the run is not `autoMode`, the grill is not `CONVERGED`, or proposal/grill paths escape the active run.
