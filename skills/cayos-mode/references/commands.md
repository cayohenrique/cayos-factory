# Command sheet

Every CLI the orchestrator needs, with exact flags. **Do not read `scripts/*.mjs`, `agents/*.md`, `contracts/*.md`, or `tests/` to learn usage.** This sheet is the contract. `P=${CURSOR_PLUGIN_ROOT}`, `R=<project git root>`, `RUN=$R/.cayos/runs/<run-id>`.

## Preflight

```text
node $P/scripts/doctor.mjs --full --root $R
node $P/scripts/run-state.mjs init --root $R --run-id <id> --ticket <ref> [--mode auto]
node $P/scripts/run-state.mjs show --root $R
```

## Ticket

```text
node $P/scripts/run-state.mjs transition --root $R --to TICKET_RESOLVED --reason "<why>"
node $P/scripts/run-state.mjs snapshot --root $R --file $RUN/ticket-source.json --kind ticket
node $P/scripts/run-state.mjs checkpoint --root $R --reason "<why>" [--snapshot-id <sha>] [--ticket-revision <rev>]
```

Manual mode then: `transition --to UNDERSTANDING_PENDING`. Auto mode: `auto-advance --to PREPARING` then later `auto-advance --to IMPLEMENTING`.

## Gates (manual mode)

```text
node $P/scripts/run-state.mjs propose --root $R --gate <gate> --proposal-file <file>
# User sends the printed approvalCommand verbatim. Then:
node $P/scripts/run-state.mjs transition --root $R --to <state> --actor user --approval <gate> --proposal-file <file> --approval-evidence <sha256 of approvalCommand>
```

Gate → next state: `sharedUnderstanding→TEST_SEAM_PENDING`, `testSeam→PLAN_PENDING`, `ticketPlan→READY_TO_IMPLEMENT`, `implementation→IMPLEMENTING`, `pullRequest→OPENING_PR`.

## Auto mode prepare

```text
node $P/scripts/engineering-loop.mjs init --root $R
node $P/scripts/run-state.mjs auto-advance --root $R --to PREPARING
node $P/scripts/run-state.mjs auto-advance --root $R --to IMPLEMENTING
```

Do not grill, propose, or auto-approve pre-implementation gates in auto mode.

## Implementation

```text
git -C <repo> checkout -b cayos/<run-id>/<ticket>
git -C <repo> worktree add $R/.cayos/worktrees/<slice> -b cayos/<run-id>/<slice> <base>   # only true parallel workers
node $P/scripts/run-state.mjs register-worktree --root $R --path <path> --base-commit <sha> --ticket <slice>
node $P/scripts/handoff.mjs create --root $R --input $RUN/handoffs/<id>.input.json --output $RUN/handoffs/<id>.json
node $P/scripts/handoff.mjs verify --root $R --input $RUN/handoffs/<id>.json
node $P/scripts/run-state.mjs checkpoint --root $R [--worktree <path>] --reason "<why>"
node $P/scripts/run-state.mjs transition --root $R --to REVIEWING|VERIFYING|READY_FOR_PR --reason "<why>"
```

One-worker compact handoff keys: `kind: "compact"`, `ticket`, `snapshotId`, `acceptanceCriteria[]`, `likelyFiles[]`, `testSeam`, `checks[]`, `constraints[]`. Parallel workers still use the full hashed worktree contract. `checks` cannot be `true`, `:` or `echo`. Review uncommitted `git diff` before the first commit.

## Verify and close

```text
node $P/scripts/browser-mcp.mjs doctor
node $P/scripts/run-state.mjs propose --root $R --gate pullRequest --proposal-file $RUN/proposals/pullRequest.md
node $P/scripts/run-state.mjs transition --root $R --to OPENING_PR --actor user --approval pullRequest --proposal-file <file> --approval-evidence <sha256 of approvalCommand>
node $P/scripts/run-state.mjs transition --root $R --to DONE --reason "<why>"
node $P/scripts/run-state.mjs resume --root $R
node $P/scripts/run-state.mjs abort --root $R
```

## Models

`taskModelForComplexity(size, local)` for implement/repair. `taskModelForReview("fast"|"deep", local)` for review. Omit Task `model` when inherit. Grill interviewer/interviewee are optional and unused by auto mode.
