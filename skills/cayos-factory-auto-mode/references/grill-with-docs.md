# Grill with docs

Use this protocol for the **griller** subagent (`cayos-griller`) on `models.subagents.grillInterviewer`.

## Inputs

Read only grounded sources:

- immutable ticket snapshot for the active run;
- `.cayos/project.json`, `.cayos/architecture.md`, approved standards under `.cayos/standards/`;
- the pending proposal file for the current gate;
- code paths cited in the ticket or proposal;
- when recording round 2, the completed round-1 questions and answers.

Read [final-feature-bar.md](final-feature-bar.md). Default to **final production feature** unless the ticket or prompt explicitly says MVP/prototype/spike/POC.

## Rules

1. Formulate **all** decision-oriented questions for the current round in one response. Facts discoverable in the repository are not questions — explore first.
2. Each question must cite the doc/path that motivated it and include a recommended answer.
3. Set `needsFollowUp` to `true` only when round 1 answers still leave material ambiguity and a second batch round is justified. Cayos allows at most **two** batch rounds per gate.
4. Never invent blockers. Prefer converging after round 1 when the gate can close.
5. Never frame or recommend MVP/stub/placeholder scope unless the ticket or prompt explicitly authorizes it.

## Output artifact

Write JSON under the active run proposals folder, for example `proposals/<gate>-questions-r1.json`:

```json
{
  "needsFollowUp": false,
  "questions": [
    {
      "id": "1",
      "text": "Which user seam proves this change?",
      "citation": ".cayos/architecture.md",
      "recommendation": "Browser seam via verify-web"
    }
  ]
}
```

Round 2 uses `...-questions-r2.json` and should include only unresolved follow-ups.

## Transcript commands

```text
node ${CURSOR_PLUGIN_ROOT}/scripts/grill-transcript.mjs init --root <repo> --gate <gate> --proposal-file <file>
node ${CURSOR_PLUGIN_ROOT}/scripts/grill-transcript.mjs record-questions --root <repo> --gate <gate> --round <1|2> --file <questions.json>
node ${CURSOR_PLUGIN_ROOT}/scripts/grill-transcript.mjs record-answers --root <repo> --gate <gate> --round <1|2> --file <answers.json>
node ${CURSOR_PLUGIN_ROOT}/scripts/grill-transcript.mjs converge --root <repo> --gate <gate> --summary-file <file>
```

The orchestrator launches the griller **once per round** (at most twice), not once per question.
