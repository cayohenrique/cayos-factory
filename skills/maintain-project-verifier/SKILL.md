---
name: maintain-project-verifier
description: Repair or extend an existing project verifier when runtime, features, or evidence contracts drift.
---

# Maintain Project Verifier

Compare verifier commands and feature maps with current runtime/source for each configured repository entry. Reproduce the failure, update only grounded commands/helpers/features, run Doctor and one affected real path per touched repository, preserve evidence, and renew capability-lock hashes. When any repository entry uses `seam: "browser"`, keep its `Browser` section aligned with `chrome-agent-mcp` and re-run `browser-mcp.mjs doctor` before claiming readiness. Never remove a check solely to regain READY, replace real browser driving with HTTP-only checks for a browser seam, or hide cleanup failures.
