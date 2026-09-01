# Implementer filesystem scope

Applies to `cayos-implementer` and `cayos-repairer` subagents during `IMPLEMENTING`.

## Granted access

- **Full read and write** across the primary project Git root and every related repository bound in `.cayos/local.json` → `relatedRepositories`.
- Read any path required to understand dependencies, tests, config, standards, architecture, and the approved seam — including files not listed in the handoff.
- Edit any file required to deliver the approved slice, not only paths named in `projectGuidance`.

The handoff defines **ticket behavior**, API boundaries, and checks. It is **not** a directory jail.

## Required behavior

- Do **not** ask the user to approve reading or editing project files. You already have full project access for this run.
- Do **not** stop work to request "permission" for paths outside the handoff list when those files are needed to implement or verify the slice.
- Prefer the registered branch/worktree for commits, but explore the wider repository freely.
- Never edit unrelated slices, push, merge, open PRs, or mutate the ticket provider.

## Orchestrator Task prompt

When delegating implementation or repair, include:

```text
Filesystem: full read/write on the project git root (<absolute-path>) and bound related repositories. Do not ask the user for file access. Handoff boundaries are behavioral, not a file allowlist.
```

Pass the verified handoff JSON and the absolute `worktree.path` (or branch checkout path).
