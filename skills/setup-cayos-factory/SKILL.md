---
name: setup-cayos-factory
description: Configure project standards, architecture, ticket provider, models, and a proven verifier for Cayos Factory.
disable-model-invocation: true
---

# Setup Cayos Factory

Run only by explicit `/setup-cayos-factory`.

1. Confirm the primary Git root. Ask for related repositories; scan only those explicitly approved. Read [references/project-discovery.md](references/project-discovery.md).
2. Show candidate code standards/pattern documents with evidence and ask which remain authoritative. Never decide from filenames alone.
3. For each detected TypeScript, JavaScript, PHP, CSS, or Tailwind stack without an approved standard, ask whether to create one from the matching plugin baseline. Copy only approved baselines into `.cayos/standards/`.
4. Separate declared and observed architecture. Create `.cayos/architecture.md` with a compact container diagram and main application-flow diagram. Show it and ask whether it is correct and should be followed by default. Treat approval as a preferred pattern with explicit deviations, not an eternal prohibition on evolution.
5. Ask which skill, MCP, app, or CLI adapter reads tasks. Bind only read operations. For CLI use fully anchored `readCommandPatterns`; never a prefix allowlist.
6. Ask/bind model and effort for orchestrator, implementer, small reviewer, deep reviewers, repairer, and evaluator.
7. Write committed `.cayos/project.json` from the example and local `.cayos/local.json`. Enforce read-only tracker and `autoMerge: false`.
8. Reuse a structurally valid project verifier or call `create-project-verifier`.
9. Execute provider contract probes and one real mapped verification path. Preserve evidence.
10. Hash configs, approved standards, architecture, discovery evidence, provider adapter, verifier tree, declared source paths, and runtime evidence into `.cayos/capabilities.lock.json` with timestamp and contract version.
11. Run Doctor full. Setup succeeds only at READY; otherwise report the exact missing dependency, approval, or proof.

Never claim a capability because a name exists. Prove it through a safe read or real verification action.
