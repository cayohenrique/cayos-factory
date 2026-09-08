# Model policy

Cayos binds models by **delivery surface** (parent chat) and subagent classes. Grill interviewer/interviewee are **optional** and unused by auto mode.

## Presets

| Preset | `smallTask` | `mediumTask` | `complexTask` | `reviewFast` | `reviewDeep` |
|--------|-------------|--------------|----------------|--------------|--------------|
| **balanced** (default) | fast | fast | judgment | fast | judgment |
| **single-model** | same slug | same | same | same | same |
| **cost-optimized** | cheap fast | cheap fast | premium | cheap fast | premium |

Suggested slugs: fast `composer-2.5-fast`, default coding `composer-2.5`, judgment `claude-opus-5-thinking-high`.

Optional `grillInterviewer` / `grillInterviewee` may still be stored for `/cayos-mode` grill experiments. Legacy `reviewer` fills both review keys.

## Write to `.cayos/local.json`

```json
{
  "models": {
    "delivery": "inherit",
    "subagents": {
      "smallTask": "composer-2.5-fast",
      "mediumTask": "composer-2.5",
      "complexTask": "claude-opus-5-thinking-high",
      "reviewFast": "composer-2.5",
      "reviewDeep": "claude-opus-5-thinking-high"
    }
  }
}
```

## Runtime routing

- Implementation/repair: `taskModelForComplexity("small"|"medium"|"large")`
- Review: `taskModelForReview("fast"|"deep")`
- Auto mode does not call grill models
