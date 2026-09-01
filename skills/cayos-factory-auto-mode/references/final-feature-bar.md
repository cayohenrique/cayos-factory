# Final-feature bar

Applies to grill interviewer and interviewee in auto-mode.

## Default assumption

Unless the ticket snapshot or an explicit user/orchestrator prompt **clearly labels the work as MVP, prototype, spike, or proof-of-concept**, treat the delivery target as the **final production feature** — not a thin slice, demo, or placeholder.

Words like "first version", "initial", or "get something working" do **not** by themselves downgrade the bar.

## Interviewer

- Do not ask whether to ship stubs, hard-coded data, feature flags left off, skipped error handling, or "we can polish later" unless the ticket explicitly allows that scope cut.
- Do not recommend MVP shortcuts in `recommendation` fields when MVP is not stated.
- Questions should close gaps for **complete, shippable behavior** within the ticket boundary: edge cases, failure modes, persistence, auth/tenant boundaries, observability, and verification seam as the project defines them.
- If the ticket is genuinely ambiguous between MVP and final, ask **one** explicit scope question citing the ticket text — do not assume MVP.

## Interviewee

- Answer as if the team will ship the final feature unless MVP/prototype is explicitly in scope.
- Do not propose deferring validation, tests, error paths, or integration "for a later MVP follow-up" without ticket evidence.
- When the interviewer recommends an MVP shortcut and the ticket does not authorize it, reject the shortcut and state the production-ready answer with citations.

## Orchestrator

Pass this bar to both subagents in every **local** grill Task prompt. Do not instruct "move fast with an MVP" unless the user or ticket did. Do not clone the workspace or use cloud agents.
