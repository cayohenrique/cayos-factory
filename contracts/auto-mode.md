# Auto mode contract

`/cayos-factory-auto-mode` may be invoked only explicitly. Runs initialized with `--mode auto` keep approval gates, but pre-implementation gates (`sharedUnderstanding`, `testSeam`, `ticketPlan`, `implementation`) may close through a converged `grill-with-docs` transcript and `run-state auto-approve`. Pull-request gates still require a captured user message. Auto-approve rejects non-auto runs, missing convergence, proposal drift, and gate mismatch. Grill transcripts are append-only until convergence and must contain at least one question-answer pair.
