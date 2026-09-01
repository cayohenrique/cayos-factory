---
name: verify-fixture-web
description: Verify the fixture web server through its public browser boundary with chrome-agent-mcp.
---
# Verify fixture web
## Launch
Run `node app.mjs` and capture its JSON port line.
## Doctor
Require Node.js, `app.mjs`, an available loopback port, and `node ${CURSOR_PLUGIN_ROOT}/scripts/browser-mcp.mjs doctor` passing when Chrome remote debugging is available.
## Browser
Use MCP server `chrome-agent-mcp` on port 9222. During Drive call `browser_navigate`, `browser_evaluate`, and `browser_take_screenshot`. HTTP-only checks are insufficient when Chrome is available.
## Drive
Open `http://127.0.0.1:<port>/` in a real browser tab and read `document.body.innerText`.
## Evidence
Persist URL, evaluated expression, observed text, and screenshot path as JSON.
## Cleanup
Terminate only the launched child and keep evidence.
## Helpers
Run `node scripts/browser-verify.mjs <evidence-path> <screenshot-path>`. Use `node scripts/verify.mjs <evidence-path>` only as an HTTP fallback probe.
