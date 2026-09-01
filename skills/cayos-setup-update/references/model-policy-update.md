# Model policy update

Use during `/cayos-setup-update` when subagent model bindings should change.

## Show current bindings

Read all six keys from `.cayos/local.json` → `models.subagents`:

- `grillInterviewer`
- `grillInterviewee`
- `smallTask`
- `mediumTask`
- `complexTask`
- `reviewer`

## Apply per subagent

```text
node ${CURSOR_PLUGIN_ROOT}/scripts/setup-update.mjs models --root <repo> \
  --grill-interviewer <slug> \
  --grill-interviewee <slug> \
  --small-task <slug> \
  --medium-task <slug> \
  --complex-task <slug> \
  --reviewer <slug>
```

Only pass flags the user approved.

## Group shortcuts

```text
node ${CURSOR_PLUGIN_ROOT}/scripts/setup-update.mjs models --root <repo> --fast <slug>
```

Sets `grillInterviewer`, `smallTask`, and `mediumTask`.

```text
node ${CURSOR_PLUGIN_ROOT}/scripts/setup-update.mjs models --root <repo> --judgment <slug>
```

Sets `grillInterviewee`, `complexTask`, and `reviewer`.

The script refreshes `capabilities.lock.json` → `localHash`. Run Doctor full afterward.
