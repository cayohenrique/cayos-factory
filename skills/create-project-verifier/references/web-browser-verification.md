# Web browser verification with chrome-agent-mcp

Use this reference when discovery shows a web UI seam: React/Vue/Next, static HTML, or any project whose real user boundary is a browser page rather than a raw HTTP/CLI call.

## Prerequisites

1. Chrome started with remote debugging, for example `google-chrome --remote-debugging-port=9222`.
2. `chrome-agent-mcp` available to the agent. Add `${CURSOR_PLUGIN_ROOT}/assets/mcp/chrome-agent-mcp.json` to the project or user MCP config.
3. Project policy records the browser seam in `.cayos/project.json`:

```json
"verification": {
  "skill": ".cursor/skills/verify-<project>",
  "seam": "browser",
  "sourcePaths": ["src"],
  "browser": { "mcpServer": "chrome-agent-mcp", "debugPort": 9222 }
}
```

Bind the same server name in `.cayos/local.json` when Doctor runs with `--full`.

## Verifier shape

Keep the standard `Launch`, `Doctor`, `Drive`, `Evidence`, `Cleanup`, and `Helpers` sections. Add a `Browser` section that names the MCP server, debug port, and the exact tools used during Drive:

```markdown
## Browser
Use MCP server `chrome-agent-mcp` on port 9222. During Drive call `browser_navigate`, `browser_evaluate`, and `browser_take_screenshot`. HTTP-only checks are insufficient for this seam.
```

## Scripts

Create project-local helpers that wrap the plugin client instead of re-implementing CDP:

- `node ${CURSOR_PLUGIN_ROOT}/scripts/browser-mcp.mjs doctor --port 9222` — readiness probe.
- `node ${CURSOR_PLUGIN_ROOT}/scripts/browser-mcp.mjs verify-page --url <url> --expression <js> --expect <text> --evidence <path> --screenshot <path>` — deterministic browser proof for setup and CI when Chrome is available.

Launch the app first, then pass the real loopback URL to `verify-page`. Keep an HTTP helper only when the project also exposes a non-UI API seam worth proving separately.

## Evidence contract

Browser evidence must include:

- navigation target (URL);
- evaluated expression and observed value;
- screenshot path when the UI is visual;
- action plus resulting DOM/text state — not screenshot alone.

Preserve evidence after cleanup.

## Agent Drive phase

During `cayos-verify`, the implementing agent must use `chrome-agent-mcp` tools for Drive when `verification.seam` is `browser`. Scripts prepare and replay proofs; MCP drives the real browser during ticket verification.
