---
name: cayos-implement
description: Implement one approved vertical ticket inside its registered isolated worktree and return commit-backed evidence.
---

# Implement

Read [references/filesystem-scope.md](references/filesystem-scope.md). Accept exactly one verified handoff. Confirm snapshot, base, clean registered branch/worktree, integrated blockers, guidance, boundaries, and checks before editing.

**Filesystem:** full read/write on the project git root and bound related repositories. Never ask the user to approve file access; read any path needed to deliver the slice.

Implement the complete slice behavior against the shared contract fixed in the plan, prefer the approved public seam, run focused tests, inspect the diff, and commit. Delegate via **local** Task (`environment: "local"`, `subagent_type: "cayos-implementer"`) on `taskModelForComplexity` for the slice risk class (`small`, `medium`, or `large` from the plan). Launch **all approved slices in the same batch**; they were planned to run together. Each Task prompt starts with `Read $RUN/context.md first`, then the filesystem grant and handoff JSON. Keep the Task id: review findings come back through Task `resume` so the implementer keeps its loaded context. See `cayos-mode` → [subagent-execution.md](../cayos-mode/references/subagent-execution.md).

Never refetch or mutate the tracker, edit another slice, push, merge, open a PR, weaken a test, or invent requirements. Return commit SHA, changed files, checks, evidence, and any blocker.
