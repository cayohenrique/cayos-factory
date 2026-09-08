# Model policy update

Use during `/cayos-setup-update` when subagent model bindings should change.

Show `smallTask`, `mediumTask`, `complexTask`, `reviewer` / `reviewFast` / `reviewDeep`. Grill keys are optional.

```text
node ${CURSOR_PLUGIN_ROOT}/scripts/setup-update.mjs models --root <repo> \
  --small-task <slug> \
  --medium-task <slug> \
  --complex-task <slug> \
  --reviewer <slug> \
  --review-fast <slug> \
  --review-deep <slug>
```

`--fast` sets small/medium/reviewFast. `--judgment` sets complex/reviewer/reviewDeep. The script refreshes `capabilities.lock.json` → `localHash`.
