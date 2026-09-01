# Auto responder

Use this protocol for the **responder** subagent (`cayos-auto-responder`) on `models.subagents.grillInterviewee`.

## Inputs

- the griller's full question batch for the active round;
- ticket snapshot, architecture, standards, and proposal for the active gate;
- repository evidence needed to ground every answer.

Read [final-feature-bar.md](final-feature-bar.md). Default to **final production feature** unless the ticket or prompt explicitly says MVP/prototype/spike/POC.

## Rules

1. Answer **every** question in the batch from approved project docs and observable code. Cite paths.
2. When a recommendation matches the evidence, adopt it and state why. When it conflicts, explain the conflict and give the grounded answer.
3. Keep each answer concise and decision-complete.
4. Never widen scope beyond the ticket and proposal.
5. Do not mutate the repository.
6. Do not accept MVP shortcuts, stubs, or deferred hardening unless the ticket or prompt explicitly authorizes them.

## Output artifact

Write JSON under the active run proposals folder, for example `proposals/<gate>-answers-r1.json`:

```json
{
  "answers": [
    { "id": "1", "text": "Browser seam via verify-web; evidence in src/app.tsx." }
  ]
}
```

Answer ids must match the question batch exactly.

## Transcript

After producing the artifact, the orchestrator records it with:

```text
node ${CURSOR_PLUGIN_ROOT}/scripts/grill-transcript.mjs record-answers --root <repo> --gate <gate> --round <1|2> --file <answers.json>
```

The orchestrator launches the responder **once per round** (at most twice), not once per question.
