# Subagent execution

Cayos Factory runs in the **current Cursor workspace**. Isolation is Git-shaped (feature branch, optional `git worktree`), not a new agent window.

## Required

- Keep orchestration in the parent chat that invoked `/cayos-mode` or `/cayos-factory-auto-mode`.
- Launch subagents with Task `environment: "local"` (never `cloud`).
- Use `subagent_type` Cayos agents against this repository root.
- Default **one** implementer. Parallel workers only when independence, simultaneous start, disjoint files, and wall-clock gain all hold.
- Before `IMPLEMENTING`, do not create implementation branches, worktrees, or implementer Tasks.
- At `IMPLEMENTING`, isolate with a **feature branch** (`git checkout -b cayos/<run-id>/<ticket>`). Use `git worktree add` only for true parallel working directories or when the current checkout cannot host the branch.
- Grant full project filesystem access in implementation Task prompts. See [filesystem-scope.md](../cayos-implement/references/filesystem-scope.md).
- Implementer Tasks receive compact handoff JSON. Do not dump architecture docs or implementer reasoning into the reviewer prompt.
- Review with `cayos-reviewer` against the uncommitted diff. Repair via Task `resume`. Fresh `cayos-repairer` only if resume is unavailable.
- Auto mode must not launch `cayos-griller` or `cayos-auto-responder`.

## Forbidden

- `environment: "cloud"`, cloned Cursor workspaces, or extra CDP browsers for the same session.
- Creating worktrees merely because conceptual slices exist.
- Committing implementation before the first review.
- Skipping re-review after a material code change.

## Phrasing

- "Fresh context" means an independent slice on its own branch, not a new Cursor window.
- "Isolated worktree" means a registered git worktree path.
