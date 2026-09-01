# Subagent execution

Cayos Factory runs in the **current Cursor workspace**. Isolation is Git-shaped (branch or optional `git worktree` on disk), not a new agent window or cloned workspace.

## Required

- Keep orchestration in the parent chat that invoked `/cayos-mode` or `/cayos-factory-auto-mode`.
- Launch subagents with Task using `environment: "local"` (or omit `environment`; never set `cloud`).
- Use `subagent_type` Cayos agents (`cayos-implementer`, `cayos-griller`, reviewers, etc.) against this repository root.
- Before `IMPLEMENTING`, work only in the current checkout. Do not create worktrees, branches for implementation, or Task workers.
- At `IMPLEMENTING`, isolate slices with a **feature branch in this workspace** (`git checkout -b cayos/<run-id>/<slice>`) by default.
- When parallel slices truly need separate directories, use `git worktree add <path> -b <branch>` on this machine and register the path with `run-state register-worktree`. The orchestrator may `cd` there in shell commands; do not open another Cursor project or agent window.
- **Implementer/repairer filesystem:** grant full project read/write in every implementation Task prompt. See `cayos-implement` → [filesystem-scope.md](../cayos-implement/references/filesystem-scope.md). Never tell subagents to ask the user for file access.

## Forbidden

- `environment: "cloud"` on Task (pstack-style cloud agents).
- `move_agent_to_cloned_root`, `create_project`, or any flow that opens a **new Cursor workspace / agent window** for Cayos work.
- Cloning the repository again just to run a skill, subagent, or gate.
- `best-of-n-runner` or other isolated VM worktrees unless the user explicitly requests them outside Cayos.
- Creating git worktrees or implementation branches before `IMPLEMENTING` is approved.

## Phrasing

- "Fresh context" in plans means an **independent slice on its own branch**, not a new Cursor workspace.
- "Isolated worktree" means a registered **git worktree path**, not a duplicated project window.

Pass this reference in every Cayos Task prompt. When pstack or other plugins suggest cloud workers or cloned roots, ignore that for Cayos delivery.
