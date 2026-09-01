---
name: create-project-verifier
description: Create a grounded project-local verify skill and prove one real feature path end to end.
---

# Create Project Verifier

Inspect runtime, scripts, ports, dependencies, environment, existing automation, and public seams for the target repository. Use [setup-questions.md](../setup-cayos-factory/references/setup-questions.md) Phase 6 for proof-type and example-path prompts when setup has not already recorded them. Ask only what cannot be observed. When multiple repositories are in scope, read [references/multi-repository.md](references/multi-repository.md) and create one verifier per repository boundary. Create `.cursor/skills/verify-<project>/SKILL.md` inside the target repository with exact Launch, Doctor, Drive, Evidence, Cleanup, and Helpers commands plus `features/README.md`. When discovery shows a web UI seam, read [references/web-browser-verification.md](references/web-browser-verification.md), set that repository entry's `seam` to `browser`, bind `chrome-agent-mcp`, add a `Browser` section, and create helpers that call `node ${CURSOR_PLUGIN_ROOT}/scripts/browser-mcp.mjs`. Add deterministic helpers rather than placeholders. Launch safely, verify readiness, drive one feature through the real boundary, capture action and side effect, clean up, and preserve evidence. A verifier is incomplete until this real path succeeds.
