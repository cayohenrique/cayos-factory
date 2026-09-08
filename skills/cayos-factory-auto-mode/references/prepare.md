# Prepare

After the ticket snapshot, write two small artifacts. Do not write a full spec unless the ticket is genuinely architectural.

## `$RUN/context.md`

Ticket-specific only (about 20–60 lines). Use `.cayos/project.json`, `.cayos/architecture.md`, and `.cayos/standards/` as cached project knowledge; do not copy them.

```markdown
# Run Context

## Repositories
- repo: path

## Relevant flow
user action → `file:symbol` → `file:symbol` → side effect

## Existing behavior
- `file:symbol`: ...

## Relevant contracts
- `file`: `Type`

## Relevant checks
- ...

## Constraints
- ...

## Open gaps
- ...
```

## `$RUN/prepare.md`

```markdown
# Prepare

## Goal
<one concise paragraph>

## Acceptance criteria
- ...

## Likely implementation area
- `path/file.ts`: `symbol`

## Risks / assumptions
- ...

## Fast checks
- `npm test -- ...`

## Real verification
seam: browser | http | cli | other
verifiableLocally: true | false
recipe: ...

## Baseline
For bugs: reproduced: true | false | not-practical
Evidence: ...
```

Ask the user only when two valid product interpretations remain and the repository has no established behavior. Facts in source, tests, schema, routes, or config are not questions.
