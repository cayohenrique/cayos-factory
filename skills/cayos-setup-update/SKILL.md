---
name: cayos-setup-update
description: Update Cayos Factory local bindings after initial setup without rerunning full project discovery.
disable-model-invocation: true
---

# Cayos Setup Update

Invoke only as `/cayos-setup-update`. Never auto-trigger.

Use this skill when the project is already configured and only local bindings need to change. Read [references/model-policy-update.md](references/model-policy-update.md) before applying updates.

## Supported updates

1. **Model policy** — change any `models.subagents` binding or use `--fast` / `--judgment` group shortcuts.
2. Future: ticket-provider and related-repository path bindings (not yet scripted).

## Flow

1. Run Doctor without `--full` and stop if project config or verifier structure is broken.
2. Ask what should change. Show all six current `models.subagents` bindings and confirm new slugs.
3. Apply only approved changes:

```text
node ${CURSOR_PLUGIN_ROOT}/scripts/setup-update.mjs models --root <repo> [--grill-interviewer <model>] [--grill-interviewee <model>] [--small-task <model>] [--medium-task <model>] [--complex-task <model>] [--reviewer <model>] [--fast <model>] [--judgment <model>]
```

4. Run Doctor full. Report READY or the exact failing check.

Never rewrite `.cayos/project.json`, architecture, standards, or verifier proofs during a model-only update. Never weaken capability-lock checks.
