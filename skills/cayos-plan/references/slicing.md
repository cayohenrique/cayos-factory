# Slicing

Default is **one worker**. Slices exist only when parallelism has a clear wall-clock advantage.

## Rules

1. **One ticket, one branch, one implementer** unless every condition below holds.
2. **Slice by independence, never by layer.** "Migration → service → API → UI" is one worker.
3. Two workers only if: work is independent, both can start immediately, neither needs the other's code, they do not significantly edit the same files, and parallelism likely saves meaningful time.
4. If uncertain, use one worker. Do not create extra worktrees for conceptual slices.
5. When two workers exist, fix the shared contract in the plan and create hashed handoffs for each.

## Example

Backend behavior plus independent UI against an already-known contract may be two workers. Types then database then API is not.

## Plan brief (manual mode)

State worker count (default 1), repositories, model, review mode from expected risk, acceptance, checks, and `verifiableLocally`.
