# Command sheet

Every CLI the orchestrator needs, with exact flags. **Do not read `scripts/*.mjs`, `agents/*.md`, `contracts/*.md`, or `tests/` to learn usage.** This sheet is the contract. `P=${CURSOR_PLUGIN_ROOT}`, `R=<project git root>`, `RUN=$R/.cayos/runs/<run-id>`.

## Preflight

```text
node $P/scripts/doctor.mjs --full --root $R                      # must print status READY
node $P/scripts/run-state.mjs init --root $R --run-id <id> --ticket <ref> [--mode auto]
node $P/scripts/run-state.mjs show --root $R
```

## Ticket

```text
node $P/scripts/run-state.mjs transition --root $R --to TICKET_RESOLVED --reason "<why>"
node $P/scripts/run-state.mjs snapshot --root $R --file $RUN/ticket-source.json --kind ticket   # prints target + sha256
node $P/scripts/run-state.mjs checkpoint --root $R --reason "<why>" [--snapshot-id <sha>] [--ticket-revision <rev>]
node $P/scripts/run-state.mjs transition --root $R --to UNDERSTANDING_PENDING --reason "<why>"
```

## Gates (manual mode)

```text
node $P/scripts/run-state.mjs propose --root $R --gate <gate> --proposal-file <file>    # prints approvalCommand, e.g. "/cayos-approve <gate> <TOKEN>"
# The user must send that exact approvalCommand as a chat message. The prompt hook (record-user-message.mjs, stdin JSON)
# appends {approved:true, promptHash} to $RUN/user-approvals.jsonl. Then:
node $P/scripts/run-state.mjs transition --root $R --to <state> --actor user --approval <gate> --proposal-file <file> --approval-evidence <sha256 of the exact approvalCommand text>
```

A message like "approved." is not evidence. Ask the user to send the printed `approvalCommand` verbatim.

Gate → next state: `sharedUnderstanding→TEST_SEAM_PENDING`, `testSeam→PLAN_PENDING`, `ticketPlan→READY_TO_IMPLEMENT`, `implementation→IMPLEMENTING`, `pullRequest→OPENING_PR`.

## Gates (auto mode, one grill per phase)

Phase A brief covers `sharedUnderstanding` + `testSeam`. Phase B brief covers `ticketPlan` + `implementation`. One grill transcript per phase, named after the first gate.

```text
node $P/scripts/run-state.mjs propose --root $R --gate sharedUnderstanding --proposal-file $RUN/proposals/understanding-brief.md
node $P/scripts/grill-transcript.mjs init --root $R --gate sharedUnderstanding --gates sharedUnderstanding,testSeam --proposal-file $RUN/proposals/understanding-brief.md
node $P/scripts/grill-transcript.mjs record-questions --root $R --gate sharedUnderstanding --round 1 --file $RUN/proposals/sharedUnderstanding-questions-r1.json
node $P/scripts/grill-transcript.mjs record-answers   --root $R --gate sharedUnderstanding --round 1 --file $RUN/proposals/sharedUnderstanding-answers-r1.json
# round 2 only when round 1 wrote needsFollowUp: true (same two commands with --round 2)
node $P/scripts/grill-transcript.mjs converge --root $R --gate sharedUnderstanding --summary-file $RUN/proposals/sharedUnderstanding-summary.md
node $P/scripts/run-state.mjs auto-approve --root $R --gate sharedUnderstanding --proposal-file <brief> --grill-file $RUN/grill/sharedUnderstanding.json --summary-file <summary>
node $P/scripts/run-state.mjs propose      --root $R --gate testSeam --proposal-file <same brief>
node $P/scripts/run-state.mjs auto-approve --root $R --gate testSeam --proposal-file <same brief> --grill-file $RUN/grill/sharedUnderstanding.json --summary-file <summary>
```

Repeat for Phase B with `--gate ticketPlan --gates ticketPlan,implementation` and `$RUN/proposals/plan-brief.md`. `auto-approve` rejects a grill whose `gates` do not include the requested gate, a proposal hash that differs from the brief, or an unconverged transcript.

## Implementation

```text
git -C <repo> checkout -b cayos/<run-id>/<slice>                                   # default isolation
git -C <repo> worktree add $R/.cayos/worktrees/<slice> -b cayos/<run-id>/<slice> <base>   # only when the primary checkout is dirty or on another branch
node $P/scripts/run-state.mjs register-worktree --root $R --path <worktree> --base-commit <sha> --ticket <slice>
node $P/scripts/handoff.mjs create --root $R --input $RUN/handoffs/<slice>.input.json --output $RUN/handoffs/<slice>.json
node $P/scripts/handoff.mjs verify --root $R --input $RUN/handoffs/<slice>.json
node $P/scripts/run-state.mjs checkpoint --root $R --worktree <worktree> --reason "<why>"    # after each slice commit
node $P/scripts/run-state.mjs transition --root $R --to REVIEWING|VERIFYING|READY_FOR_PR --reason "<why>"
```

Handoff input keys: `ticket, acceptanceCriteria[], testSeam, snapshotId, baseCommit, blockers[], integratedBlockers[], worktree{path,branch}, projectGuidance[], domainDecisions[], boundaries[], checks[]`. `checks` cannot be `true`, `:` or `echo`.

## Verify and close

```text
node $P/scripts/browser-mcp.mjs doctor                                     # browser seam only
node $P/scripts/run-state.mjs propose --root $R --gate pullRequest --proposal-file $RUN/proposals/pullRequest.md
# user sends the printed approvalCommand verbatim (hook records it), then:
node $P/scripts/run-state.mjs transition --root $R --to OPENING_PR --actor user --approval pullRequest --proposal-file <file> --approval-evidence <sha256 of approvalCommand>
node $P/scripts/run-state.mjs transition --root $R --to DONE --reason "<why>"
node $P/scripts/run-state.mjs resume --root $R                             # after interruption; exit 2 = drift
node $P/scripts/run-state.mjs abort --root $R
```

## Models

`taskModelForSubagent(role, local)` and `taskModelForComplexity(size, local)` read `.cayos/local.json` → `models.subagents`. Pass the slug as Task `model`; omit `model` when the value is `inherit`. If a Task launch fails because the slug is unknown, relaunch **without** `model` and record the fallback in the report; do not spend a grill question on it.
