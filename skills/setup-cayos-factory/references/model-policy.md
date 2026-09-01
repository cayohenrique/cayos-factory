# Model policy

Cayos binds models by **delivery surface** (parent chat) and **six subagent classes**. This matches how work is actually delegated without mirroring a flat per-agent matrix.

## Questions to ask

Ask in this order.

### 1. Delivery surface

> Will `/cayos-mode` run in this Cursor chat?

- **Yes (default):** `models.delivery: inherit`
- **No (rare):** bind an explicit delivery model slug

### 2. Grill interviewer

> Which model should formulate batched grill questions in auto-mode?

Bind as `models.subagents.grillInterviewer`. Used by `cayos-griller`.

### 3. Grill interviewee

> Which model should answer the full grill batch from project docs and code?

Bind as `models.subagents.grillInterviewee`. Used by `cayos-auto-responder`.

### 4. Small task

> Which model for localized implementation slices (single module, narrow seam)?

Bind as `models.subagents.smallTask`.

### 5. Medium task

> Which model for cross-module slices with moderate coordination?

Bind as `models.subagents.mediumTask`.

### 6. Complex task

> Which model for migrations, auth, contracts, architecture, or broad refactors?

Bind as `models.subagents.complexTask`.

### 7. Reviewer

> Which model for read-only review (small, deep, and spec reviewers)?

Bind as `models.subagents.reviewer`.

## Presets (optional shortcut)

| Preset | interviewer | interviewee | small/medium | complex | reviewer |
|--------|-------------|-------------|--------------|---------|----------|
| **balanced** | fast | judgment | fast / fast | judgment | judgment |
| **single-model** | same | same | same | same | same |
| **cost-optimized** | cheap fast | premium | cheap fast | premium | premium |

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
