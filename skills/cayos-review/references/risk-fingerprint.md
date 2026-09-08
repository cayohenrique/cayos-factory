# Risk fingerprint

Derive review `mode` and `risks` from the changed files and symbols.

| Signal | Review for |
|--------|------------|
| auth, session, permissions, roles, tenant, organization | bypass, isolation, privilege escalation, stale permissions, ownership |
| schema, migration, queries, persistence | compatibility, nullability, destructive migration, indexes, partial deploy, transactions, existing rows |
| queues, workers | retries, duplicates, idempotency, ordering, poison messages, concurrency |
| external APIs | retries, timeouts, partial failure, idempotency, compatibility, rate limits, malformed responses |
| React / UI | stale state, effects, races, loading/error paths, accessibility, existing user flows |
| public contracts | API/event compatibility, enum additions, field rename/removal, consumers |
| localized helper | cheap review; no architecture-wide exploration unless evidence shows broader risk |

`localized` → `mode: "fast"`. Any of authorization, schema, public-contract, queues → `mode: "deep"`.
