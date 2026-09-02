---
name: cayos-plan
description: Convert approved understanding into a local spec and a small set of parallel slices with a fixed shared contract, without mutating the tracker.
---

# Plan

Use approved understanding, seam, snapshot, domain decisions, `$RUN/context.md`, applicable approved standards, and the validated architecture profile. Write `spec.md` with Problem Statement, Solution, user stories, Implementation Decisions, Testing Decisions, Out of Scope, and Further Notes. State whether the plan follows the approved architecture; any deviation needs evidence, tradeoffs, and user approval.

Slice per [references/slicing.md](references/slicing.md): by independence, never by layer; default maximum two slices; every slice can start at time zero; the shared contract (types, columns, enums, endpoints, events) is fixed in the plan so slices never wait on each other's branches. A slice may span several repositories. Each slice gets repositories, risk class and model (`taskModelForComplexity`), review route, user-facing acceptance criteria, and non-trivial checks. Record `verifiableLocally` from the approved seam.

Each slice lives on its own feature branch in this workspace (not a new Cursor workspace). See `cayos-mode` → [subagent-execution.md](../cayos-mode/references/subagent-execution.md). Ask whether slicing blocks unnecessarily or splits too finely, then obtain exact ticket-plan and implementation scope/model approvals. Store artifacts only under the active run. Create/verify all worker handoffs before delegation.
