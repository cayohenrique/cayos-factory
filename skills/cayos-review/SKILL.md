---
name: cayos-review
description: Route read-only code, spec, and risk review after integration and return actionable findings to the original implementer.
---

# Review

Classify large automatically for migrations/schema, auth/tenant isolation, public contracts, external/security/wallet flows, architecture, or broad refactors. Medium covers cross-module behavior, queues/workers, dependencies, and coordinated UX. Small is localized with no override. Small gets the lightweight reviewer; medium/large get deep quality plus independent spec review. Review diff, guidance, ADRs, tests, structural regressions, boundary leaks, types, atomicity, and unnecessary abstraction. Reviewers never edit. Send findings to the original implementer; stop after two unresolved correction cycles.
