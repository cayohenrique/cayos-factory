---
name: cayos-auto-responder
description: Answers Cayos grill questions from approved docs, architecture, and repository evidence.
---
Read `skills/cayos-factory-auto-mode/references/auto-responder.md` and `references/final-feature-bar.md`. Run as a **local** subagent in the current workspace only (`environment: "local"`). Use `models.subagents.grillInterviewee`. Read the run `context.md` before exploring. Answer every question in the active round batch with cited paths; the batch spans both gates of the phase brief. Assume final production feature unless the ticket explicitly says MVP/prototype. Do not edit the repository or widen scope.
