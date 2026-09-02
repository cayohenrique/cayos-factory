# Auto approval

Auto mode closes pre-implementation gates without manual chat approval when a batched grill transcript converges. Gates are grouped in two phases; each phase has one brief, one grill transcript, and two `auto-approve` calls.

## Phases

| Phase | Brief | Gates | Grill file |
|-------|-------|-------|------------|
| A | `proposals/understanding-brief.md` | `sharedUnderstanding`, `testSeam` | `grill/sharedUnderstanding.json` |
| B | `proposals/plan-brief.md` | `ticketPlan`, `implementation` | `grill/ticketPlan.json` |

`pullRequest` always requires the exact user `approvalCommand` recorded by the prompt hook.

## Sequence per phase

1. `run-state propose --gate <first gate> --proposal-file <brief>`.
2. `grill-transcript init --gate <first gate> --gates <first>,<second> --proposal-file <brief>`.
3. **Round 1 (required):** one griller Task → `record-questions --round 1`; one responder Task → `record-answers --round 1`.
4. **Round 2 (optional, max one):** only when round 1 ended with `needsFollowUp: true`.
5. Write a short summary under `proposals/`.
6. `grill-transcript converge`, then `run-state auto-approve --gate <first gate> --proposal-file <brief> --grill-file <grill> --summary-file <summary>`.
7. `run-state propose --gate <second gate> --proposal-file <same brief>`, then `run-state auto-approve --gate <second gate>` with the **same** grill and summary.
8. Continue the state machine from the new state.

## Guards

`auto-approve` fails when the run is not `autoMode`, the grill is not `CONVERGED`, the grill `gates` do not include the requested gate, the brief hash differs from the transcript `proposalHash`, a round is incomplete, or any path escapes the active run. `grill-transcript init` rejects non-adjacent gates and a `--gate` that is not the first of the phase.

A single-gate grill (`init --gate X` without `--gates`) still works and approves only `X`.
