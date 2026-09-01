# Model policy

Cayos binds models by **delivery surface** and **work tier**, not by internal agent name. This keeps setup aligned with gates (`understand` → `plan` → `implement` → `review` → `verify`) instead of mirroring a per-role matrix like pstack.

## Questions to ask

Ask in this order. Stop after tier 3 unless the team will use `/cayos-factory-auto-mode`.

### 1. Delivery surface

> Will `/cayos-mode` run in this Cursor chat?

- **Yes (default):** set `models.delivery` to `inherit`. The parent chat orchestrates; do not bind a separate orchestrator model.
- **No (rare):** bind an explicit delivery model slug.

### 2. Fast execution tier

> For isolated worktree implementation, localized review, and focused repair loops, which model should Cayos use?

Bind as `models.work.fast`. Typical choices: a fast or medium coding model.

This tier covers implementer, small reviewer, and repairer work without asking three separate questions.

### 3. Judgment tier

> For medium/large review, spec alignment, and planning analysis that needs deeper scrutiny, which model?

Bind as `models.work.judgment`. Typical choices: a higher-reasoning model.

This tier covers deep reviewers and spec review without listing every reviewer agent.

### 4. Auto-mode grill (only when auto-mode is in scope)

> Will the team use `/cayos-factory-auto-mode` for pre-implementation grill Q&A?

If **no**, skip auto-mode bindings.

If **yes**, ask whether grill/respond should **reuse the fast/judgment tiers** (recommended) or override:

- `models.autoMode.grill` — fast questioner (`cayos-griller`)
- `models.autoMode.respond` — grounded responder (`cayos-auto-responder`)

When omitted, grill inherits `work.fast` and respond inherits `work.judgment`.

## Do not ask during default setup

- Per-agent bindings (`orchestrator`, `smallReviewer`, `deepReviewers`, …) unless the user explicitly requests overrides.
- `evaluator` — reserved for Cayos Factory plugin adversarial tests, not customer project setup.

## Presets (optional shortcut)

Offer one preset, then confirm tiers:

| Preset | `delivery` | `work.fast` | `work.judgment` |
|--------|------------|-------------|-----------------|
| **balanced** (default) | `inherit` | user picks fast tier | user picks judgment tier |
| **single-model** | `inherit` | same slug | same slug |
| **cost-optimized** | `inherit` | cheapest acceptable coding model | premium reasoning model |

## Write to `.cayos/local.json`

Preferred shape:

```json
{
  "models": {
    "delivery": "inherit",
    "work": {
      "fast": "composer-2.5-fast",
      "judgment": "claude-opus-5-thinking-high"
    },
    "autoMode": {
      "grill": "composer-2.5-fast",
      "respond": "claude-opus-5-thinking-high"
    }
  }
}
```

`autoMode` is optional; omit it when grill/respond should inherit from `work`.

## Legacy per-agent overrides

Older projects may still set flat keys (`implementer`, `deepReviewers`, …). Doctor normalizes them into tiers. New setups should prefer tiers; use per-agent keys only when a specific subagent must diverge from its tier.

## Runtime resolution

Skills and agents resolve bindings through `normalizeModelPolicy()` in `scripts/models.mjs`. Values `inherit`, `inherit-parent`, and `auto` mean omit the Task `model` parameter and run on the parent chat model.
