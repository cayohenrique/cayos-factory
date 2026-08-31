---
name: setup-cayos-factory
description: Configure a repository, ticket provider, models, and a proven project verifier for Cayos Factory.
disable-model-invocation: true
---

# Setup Cayos Factory

Run only by explicit `/setup-cayos-factory`.

1. Confirm the Git root and read project guidance.
2. Ask which skill, MCP, app, or CLI adapter reads tasks. Bind only read operations. For CLI use fully anchored `readCommandPatterns`; never a prefix allowlist.
3. Ask/bind model and effort for orchestrator, implementer, small reviewer, deep reviewers, repairer, and evaluator.
4. Write committed `.cayos/project.json` from the example and local `.cayos/local.json`. Enforce read-only tracker and `autoMerge: false`.
5. Reuse a structurally valid project verifier or call `create-project-verifier`.
6. Execute provider contract probes and one real mapped verification path. Preserve evidence.
7. Hash project config, local binding, provider adapter, verifier tree, declared source paths, and evidence into `.cayos/capabilities.lock.json` with timestamp and contract version.
8. Run Doctor full. Setup succeeds only at READY; otherwise report exact missing dependency/proof.

Never claim a capability because a name exists. Prove it through a safe read or real verification action.
