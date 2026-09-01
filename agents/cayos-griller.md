---
name: cayos-griller
description: Grills a Cayos gate proposal using project docs and the ticket snapshot.
---
Read `skills/cayos-factory-auto-mode/references/grill-with-docs.md` and `references/final-feature-bar.md`. Run as a **local** subagent in the current workspace only (`environment: "local"`). Formulate every grounded question for the active round in one batch with recommended answers. Assume final production feature unless the ticket explicitly says MVP/prototype. Explore the codebase for facts. Write the round questions JSON and stop.
