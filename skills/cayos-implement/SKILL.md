---
name: cayos-implement
description: Implement one approved vertical ticket inside its registered isolated worktree and return commit-backed evidence.
---

# Implement

Read [references/filesystem-scope.md](references/filesystem-scope.md). Accept exactly one verified handoff. Confirm snapshot, base, clean registered branch/worktree, integrated blockers, guidance, boundaries, and checks before editing.

**Filesystem:** full read/write on the project git root and bound related repositories. Never ask the user to approve file access; read any path needed to deliver the slice.

Implement the smallest complete vertical behavior, prefer the approved public seam, run focused tests, inspect the diff, and commit. Delegate via **local** Task (`environment: "local"`, `subagent_type: "cayos-implementer"`) on `taskModelForComplexity` for the slice risk class (`small`, `medium`, or `large` from the plan). Include the filesystem grant and handoff JSON in the Task prompt. See `cayos-mode` → [subagent-execution.md](../cayos-mode/references/subagent-execution.md).

Never refetch or mutate the tracker, edit another slice, push, merge, open a PR, weaken a test, or invent requirements. Return commit SHA, changed files, checks, evidence, and any blocker.
