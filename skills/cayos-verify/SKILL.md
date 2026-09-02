---
name: cayos-verify
description: Verify implemented behavior through the project's real user seam and preserve action plus resulting-state evidence.
---

# Verify

Check the approved seam first. When it recorded `verifiableLocally: false` (the boundary only exists after a deploy the agent may not perform), run the package checks declared in the handoffs once, write `verification-evidence.md` stating what is deferred, which verifier recipe proves it after deploy, and stop; do not run the verifier doctor repeatedly. Otherwise load every configured repository verifier from `verification.repositories` that the ticket slice touches. Run Doctor, Launch, Drive, Evidence, and Cleanup exactly as grounded for each selected repository. When a repository entry uses `seam: "browser"`, run `node ${CURSOR_PLUGIN_ROOT}/scripts/browser-mcp.mjs doctor` during Doctor and use `chrome-agent-mcp` MCP tools (`browser_navigate`, `browser_evaluate`, `browser_take_screenshot`) during Drive; HTTP-only checks are insufficient for that repository. Exercise the real user boundary and capture both action and observable resulting state; tests or a final screenshot alone are insufficient. On failure, return concise evidence to the original implementer, rerun once, then use a fresh repairer once. After two failed repair attempts transition to BLOCKED. Preserve evidence after cleanup and run the final available suite before `READY_FOR_PR`.
