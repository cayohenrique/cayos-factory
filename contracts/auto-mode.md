# Auto mode contract

`/cayos-factory-auto-mode` may be invoked only explicitly. Runs initialized with `--mode auto` keep approval gates, but pre-implementation gates (`sharedUnderstanding`, `testSeam`, `ticketPlan`, `implementation`) may close through a converged batched `grill-with-docs` transcript and `run-state auto-approve`. Pull-request gates still require a captured user message. Auto-approve rejects non-auto runs, missing convergence, proposal drift, and gate mismatch.

Grill transcripts are version 2, append-only until convergence, and use batched rounds:

- a transcript covers one gate or a **phase of adjacent gates** (`sharedUnderstanding,testSeam` or `ticketPlan,implementation`), declared at `init --gates` and recorded in `gates`; the transcript is named after the first gate and its `proposalHash` is the phase brief;
- `auto-approve` accepts a transcript only for a gate listed in its `gates` and only with the same brief hash;
- round 1: one griller batch (`record-questions --round 1`) and one responder batch (`record-answers --round 1`) are required;
- round 2: optional single follow-up batch when round 1 sets `needsFollowUp: true`;
- at most two complete rounds per transcript.

Legacy version 1 alternating `append` transcripts remain readable for digest validation but new runs must use batch commands.

Grill interviewer and interviewee must follow `skills/cayos-factory-auto-mode/references/final-feature-bar.md`: default to **final production feature** scope. MVP/prototype/spike/POC shortcuts are forbidden unless explicitly stated in the ticket snapshot or orchestrator prompt. Both read `$RUN/context.md` before exploring.
