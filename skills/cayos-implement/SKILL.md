---
name: cayos-implement
description: Implement one ticket handoff on a feature branch, run fast checks, and return an uncommitted diff for review.
---

# Implement

Read [references/filesystem-scope.md](references/filesystem-scope.md). Accept one hashed handoff. Confirm snapshot, branch, guidance, and checks before editing.

**Filesystem:** full read/write on the project git root and bound related repositories. Never ask the user to approve file access.

Implement the smallest complete behavior, prefer the public seam, run **fast checks**, inspect `git diff`, and **stop without committing**. The orchestrator reviews the dirty diff first. Delegate via local Task `subagent_type: "cayos-implementer"` on `taskModelForComplexity`. Default one worker. Include filesystem grant and compact handoff JSON. Keep the Task id for `resume`. See [subagent-execution.md](../cayos-mode/references/subagent-execution.md).

Never refetch the tracker, push, merge, open a PR, weaken a test, or invent requirements. Return changed files, check output, and any blocker — not a commit SHA until review is clean.
