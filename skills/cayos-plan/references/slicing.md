# Slicing

Slices exist to run **in parallel**, not to order work. Wall-clock time for a ticket is orchestrator overhead plus the longest slice, so the plan should minimize the longest slice and maximize what starts at the same time.

## Rules

1. **Slice by independence, never by layer.** "Types → persistence → API → UI" is a dependency chain, not a slice plan. A slice may span several repositories when they must ship together.
2. **Two slices exist only if both can start at time zero.** If B waits for A, they are one slice. Model true blockers with `blockers` / `integratedBlockers` in the handoff; a plan whose slices all block each other is a single slice.
3. **Default maximum: 2 slices.** A third needs an explicit reason in the plan brief (three independent surfaces, or a large slice that splits cleanly along a repository boundary with no shared file).
4. **Fix the shared contract in the plan.** Field names, enum values, columns, endpoints, event names. Parallel slices code against the contract, not against each other's branches.
5. **Size each slice for one implementer.** If a slice needs more than one repository *and* more than one risk class, prefer keeping it whole on the `complexTask` model over splitting it into blocking pieces.
6. **Trivial contract edits belong to the orchestrator.** A 5-line interface change that every slice depends on is done by the orchestrator at the start of `IMPLEMENTING`, committed on the first slice branch, then both slices proceed.

## Example (landing-page publish status, six repositories)

Bad (three sequential slices, 35 min critical path):

```
S1 interfaces + queries + migration + SDK   →  S2 admin-apis + hosting  →  S3 UI
```

Good (two parallel slices, contract fixed in the plan):

```
A  backend end to end: interfaces, queries, migration, SDK, admin-apis writers, hosting writers   (complexTask)
B  list UI + verifier recipe + docs, against publishStatus/publishErrorMessage from the plan       (mediumTask)
```

## Plan brief must state

- the slices, each with repositories, risk class, model, acceptance criteria, checks;
- the shared contract;
- `dependsOn` per slice (expected empty);
- which review route each slice gets (`small` → lightweight, `medium` → combined deep+spec in one Task, `large` → deep and spec in parallel);
- whether the approved seam is reachable before deploy (`verifiableLocally: true|false`).
