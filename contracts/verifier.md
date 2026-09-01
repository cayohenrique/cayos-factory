# Project verifier contract

Each approved repository may have its own `verify-<project>` skill under that repository's `.cursor/skills/`. Committed policy lists every repository verifier in `.cayos/project.json` under `verification.repositories`. Legacy single-repo projects may keep top-level `verification.skill`; Doctor normalizes that entry to `repository: "primary"`.

Every verifier must contain grounded `Launch`, `Doctor`, `Drive`, `Evidence`, `Cleanup`, and `Helpers` sections plus `features/README.md`. When a repository entry sets `seam` to `browser`, its skill must also include a `Browser` section naming the `chrome-agent-mcp` server, debug port, and MCP tools used during Drive.

Setup must execute one mapped feature per configured repository against the real runtime boundary, preserve action and resulting-state evidence after cleanup, and hash every verifier tree, source path set, and evidence file into the capability lock. Placeholders, HTTP-only checks for a browser seam, and screenshots without observable side effects do not pass.
