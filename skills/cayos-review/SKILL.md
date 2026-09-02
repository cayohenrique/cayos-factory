---
name: cayos-review
description: Route read-only code, spec, and risk review per slice as it lands and return actionable findings to the original implementer.
---

# Review

Use the risk class fixed in the approved plan. Large: migrations/schema, auth/tenant isolation, public contracts, external/security/wallet flows, architecture, or broad refactors. Medium: cross-module behavior, queues/workers, dependencies, coordinated UX. Small: localized, no override.

Route by class, one review per slice, started as soon as that slice commits (do not wait for sibling slices):

- **small** → one `cayos-reviewer-small` Task;
- **medium** → **one** Task combining deep quality and spec review in a single prompt (`cayos-reviewer-deep` reading the spec criteria);
- **large** → `cayos-reviewer-deep` and `cayos-reviewer-spec` launched **in parallel**.

All review Tasks are **local** (`environment: "local"`) on `taskModelForSubagent("reviewer", local)`, read `$RUN/context.md` first, and receive the handoff, base..HEAD range, and plan criteria. See `cayos-mode` → [subagent-execution.md](../cayos-mode/references/subagent-execution.md).

Review diff, guidance, ADRs, tests, structural regressions, boundary leaks, types, atomicity, and unnecessary abstraction. Reviewers never edit. Findings return to the **original implementer by resuming its Task**; the orchestrator verifies non-critical fixes from `git diff` itself and launches a re-review Task only for critical/high findings. Stop after two unresolved correction cycles.
