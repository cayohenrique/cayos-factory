---
name: cayos-plan
description: Convert approved understanding into a local spec and a worker plan, defaulting to one implementer.
---

# Plan

Use approved understanding, seam, snapshot, `$RUN/context.md`, standards, and architecture. Write `spec.md` with Problem Statement, Solution, user stories, Implementation Decisions, Testing Decisions, Out of Scope, and Further Notes. State architecture follow/deviate.

Slice per [references/slicing.md](references/slicing.md): **one worker by default**. Parallel workers only for independent surfaces that can start together. Auto mode may skip this skill and use `prepare.md` instead.

Each worker lives on a feature branch in this workspace. Obtain ticket-plan and implementation approvals in **manual** mode only.
