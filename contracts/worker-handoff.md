# Worker handoff contract

Default auto-mode worker: one compact hashed envelope.

Required compact fields: `ticket`, `snapshotId`, `acceptanceCriteria[]`, `testSeam`, `checks[]`. Optional: `likelyFiles[]`, `constraints[]`, `workspace{path,branch}`. Workers run as **local** Task subagents (`environment: "local"`) with **full read/write** on the project git root and bound related repositories. They must not ask the user to approve file access. They read `prepare.md` / `context.md` only for named paths and gaps.

Parallel workers still use the full envelope: acceptance criteria, test seam, snapshot ID, base commit, registered clean branch or git worktree, integrated blockers, guidance, boundaries, domain decisions, and non-trivial checks. All parallel handoffs are created before launch.

Review findings return through Task resume. The envelope is hashed and bound to the active run. Workers never refetch the tracker, widen scope, push, merge, open a PR, or commit before review.
