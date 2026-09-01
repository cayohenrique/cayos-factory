---
name: setup-cayos-factory
description: Configure project standards, architecture, ticket provider, models, and a proven verifier for Cayos Factory.
disable-model-invocation: true
---

# Setup Cayos Factory

Run only by explicit `/setup-cayos-factory`.

Follow [references/setup-questions.md](references/setup-questions.md) for every user-facing prompt, option list, and phase order. Apply the **humanizer** skill when presenting questions: short sentences, plain words, no jargon. Use the exact meaning from setup-questions; do not add corporate or technical filler.

1. **Phase 1 — Scope:** primary Git root, single vs multiple repositories, related paths/roles/verifiers, `.cayos` owner. See [references/multi-repository.md](references/multi-repository.md).
2. **Phase 2 — Standards:** discovery evidence, per-document Follow/Ignore/Replace, missing baselines. See [references/project-discovery.md](references/project-discovery.md).
3. **Phase 3 — Architecture:** declared vs observed model, diagrams, accuracy then default-for-new-work (two separate questions).
4. **Phase 4 — Ticket provider:** closed-menu read-only binding; confirm discovered CLI when present.
5. **Phase 5 — Models:** delivery inherit (default), preset first (Balanced / Single / Cost-optimized), customize only on request. See [references/model-policy.md](references/model-policy.md).
6. **Phase 6 — Verification:** proof type and example path per repository; reuse or call `create-project-verifier`. For web UI, bind `chrome-agent-mcp` from `${CURSOR_PLUGIN_ROOT}/assets/mcp/chrome-agent-mcp.json` and set `seam` to `browser`.
7. **Phase 7 — Confirm:** summarize choices, write `.cayos/project.json` and `.cayos/local.json` (`autoMerge: false`), run provider probes and one real verification path per repository, hash into `.cayos/capabilities.lock.json`, run Doctor full. Setup succeeds only at READY.

After setup, use `/cayos-setup-update` to change model tiers without repeating discovery.

Never claim a capability because a name exists. Prove it through a safe read or real verification action.
