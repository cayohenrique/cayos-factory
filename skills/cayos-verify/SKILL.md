---
name: cayos-verify
description: Verify implemented behavior through the project's real user seam and preserve action plus resulting-state evidence.
---

# Verify

Load every configured repository verifier from `verification.repositories` that the ticket slice touches. Run Doctor, Launch, Drive, Evidence, and Cleanup exactly as grounded for each selected repository. When a repository entry uses `seam: "browser"`, run `node ${CURSOR_PLUGIN_ROOT}/scripts/browser-mcp.mjs doctor` during Doctor and use `chrome-agent-mcp` MCP tools (`browser_navigate`, `browser_evaluate`, `browser_take_screenshot`) during Drive; HTTP-only checks are insufficient for that repository. Exercise the real user boundary and capture both action and observable resulting state; tests or a final screenshot alone are insufficient. On failure, return concise evidence to the original implementer, rerun once, then use a fresh repairer once. After two failed repair attempts transition to BLOCKED. Preserve evidence after cleanup and run the final available suite before `READY_FOR_PR`.
