---
name: maintain-project-verifier
description: Repair or extend an existing project verifier when runtime, features, or evidence contracts drift.
---

# Maintain Project Verifier

Compare verifier commands and feature map with current runtime/source. Reproduce the failure, update only grounded commands/helpers/features, run Doctor and one affected real path, preserve evidence, and renew capability-lock hashes. When `verification.seam` is `browser`, keep the `Browser` section aligned with `chrome-agent-mcp` and re-run `browser-mcp.mjs doctor` before claiming readiness. Never remove a check solely to regain READY, replace real browser driving with HTTP-only checks for a browser seam, or hide cleanup failures.
