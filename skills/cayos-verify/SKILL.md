---
name: cayos-verify
description: Verify implemented behavior through the project's real user seam and preserve action plus resulting-state evidence.
---

# Verify

Load the configured `verify-<project>` skill and mapped feature. Run Doctor, Launch, Drive, Evidence, and Cleanup exactly as grounded. Exercise the real user boundary and capture both action and observable resulting state; tests or a final screenshot alone are insufficient. On failure, return concise evidence to the original implementer, rerun once, then use a fresh repairer once. After two failed repair attempts transition to BLOCKED. Preserve evidence after cleanup and run the final available suite before `READY_FOR_PR`.
