---
name: cayos-auto-responder
description: Answers Cayos grill questions from approved docs, architecture, and repository evidence.
---
Not used by `/cayos-factory-auto-mode`. Keep for `/cayos-mode` or an explicit grill request. Read `skills/cayos-factory-auto-mode/references/auto-responder.md` and `references/final-feature-bar.md`. Run as a **local** subagent (`environment: "local"`). Use `models.subagents.grillInterviewee`. Read the run `context.md` before exploring. Answer every question in the active round batch with cited paths; the batch spans both gates of the phase brief. Assume final production feature unless the ticket explicitly says MVP/prototype. Do not edit the repository or widen scope.
