# Model policy

Cayos binds models by **delivery surface** (parent chat) and **six subagent classes**. User-facing prompts and option order live in [setup-questions.md](setup-questions.md) Phase 5.

## Presets

Apply after the user chooses a preset in Phase 5b. Ask for slug(s) only when the preset needs them (e.g. **Single model** → one slug; **Balanced** → optional fast + judgment slugs with defaults below).

| Preset | `grillInterviewer` | `grillInterviewee` | `smallTask` | `mediumTask` | `complexTask` | `reviewer` |
|--------|-------------------|-------------------|-------------|--------------|---------------|------------|
| **balanced** (default) | fast tier | judgment tier | fast | fast | judgment | judgment |
| **single-model** | same slug | same | same | same | same | same |
| **cost-optimized** | cheap fast | premium judgment | cheap fast | cheap fast | premium | premium |

**Suggested default slugs** when the user accepts Balanced without naming models:

| Tier | Example slug |
|------|----------------|
| fast | `composer-2.5-fast` |
| judgment | `claude-opus-5-thinking-high` |

**Single model:** one slug for all six keys.

**Cost-optimized:** e.g. fast = `composer-2.5-fast`, premium = `claude-opus-5-thinking-high`.

## Customize (six roles)

Only when Phase 5b = **Customize**. Plain-language table in [setup-questions.md](setup-questions.md#5c-customize--six-roles-only-when-5b--customize).

| Config key | Used by |
|------------|---------|
| `grillInterviewer` | `cayos-griller` — auto-mode question batches |
| `grillInterviewee` | `cayos-auto-responder` — auto-mode answers from docs/code |
| `smallTask` | localized implementation slices |
| `mediumTask` | cross-module slices |
| `complexTask` | migrations, auth, contracts, architecture |
| `reviewer` | read-only review (small, deep, spec) |

## Write to `.cayos/local.json`

```json
{
  "models": {
    "delivery": "inherit",
    "subagents": {
      "grillInterviewer": "composer-2.5-fast",
      "grillInterviewee": "claude-opus-5-thinking-high",
      "smallTask": "composer-2.5-fast",
      "mediumTask": "composer-2.5",
      "complexTask": "claude-opus-5-thinking-high",
      "reviewer": "claude-opus-5-thinking-high"
    }
  }
}
```

Change bindings later with `/cayos-setup-update`.

## Runtime routing

- Auto-mode: `taskModelForSubagent("grillInterviewer" | "grillInterviewee")`
- Implementation/repair: `taskModelForComplexity("small" | "medium" | "large", local)` from the approved ticket slice
- Review: `taskModelForSubagent("reviewer")`

Legacy `work.fast` / `work.judgment` and flat agent keys still normalize into these six classes.

## Do not ask during default setup

- Per-internal-agent overrides (`implementer`, `deepReviewers`, …) unless explicitly requested
- `evaluator` — plugin adversarial tests only
