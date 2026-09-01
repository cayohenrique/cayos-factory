# Grill with docs

Use this protocol for the **griller** subagent (`cayos-griller`) on the fast execution tier (`models.work.fast`) or `models.autoMode.grill` when set.

## Inputs

Read only grounded sources:

- immutable ticket snapshot for the active run;
- `.cayos/project.json`, `.cayos/architecture.md`, approved standards under `.cayos/standards/`;
- the pending proposal file for the current gate;
- code paths cited in the ticket or proposal.

## Rules

1. Ask **one** decision-oriented question at a time. Facts discoverable in the repository are not questions — explore first.
2. Each question must cite the doc/path that motivated it and include a recommended answer.
3. Stop when decisions are sufficient for the gate or no material ambiguity remains. Never invent blockers.
4. After each answer from the responder, append to the grill transcript before asking the next question.

## Transcript commands

```text
node ${CURSOR_PLUGIN_ROOT}/scripts/grill-transcript.mjs init --root <repo> --gate <gate> --proposal-file <file>
node ${CURSOR_PLUGIN_ROOT}/scripts/grill-transcript.mjs append --root <repo> --gate <gate> --role question --content "<text>"
node ${CURSOR_PLUGIN_ROOT}/scripts/grill-transcript.mjs append --root <repo> --gate <gate> --role answer --content "<text>"
node ${CURSOR_PLUGIN_ROOT}/scripts/grill-transcript.mjs converge --root <repo> --gate <gate> --summary-file <file>
```

## Output

Return the gate, number of rounds, open risks, and summary path. Mark `status: CONVERGED` only after `converge` succeeds.
