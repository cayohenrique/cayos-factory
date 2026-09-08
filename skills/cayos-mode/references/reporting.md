# Reporting

Keep an append-only journal. The user-facing delivery report should emphasize engineering evidence:

```markdown
# Delivery Report

## Changed
- ...

## Fast checks
- ...

## Review
Pass 1: ...
Repair: ...
Pass 2: clean

## Real verification
Seam: browser | http | cli
Action: ...
Observed result: ...
Evidence: ...

## Remaining risks
...
```

Do not list every internal state transition unless the user asks.
