---
name: cayos-verify
description: Verify implemented behavior through the project's real user seam and preserve action plus resulting-state evidence.
---

# Verify

Run only after review convergence and a review-clean commit. When the seam recorded `verifiableLocally: false`, run declared package checks once, record deferred evidence, and stop. Otherwise load configured repository verifiers. Run Doctor, Launch, Drive, Evidence, and Cleanup. Browser seam: `browser-mcp doctor` and `chrome-agent-mcp`; HTTP-only checks are insufficient. Capture action plus observable resulting state; tests or a screenshot alone are insufficient.

On failure, send evidence to the **original implementer** (Task resume). Then: fix → fast checks → **review** → verify again. Do not patch and re-verify without review. After two failed repair attempts, BLOCKED. Preserve evidence. Never weaken guards.
