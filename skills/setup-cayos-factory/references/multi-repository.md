# Multi-repository verification

Use this reference when setup discovers more than one approved Git repository or when tickets routinely touch multiple runtimes.

## Setup questions

Ask explicitly:

1. Which repositories are in scope besides the primary Git root?
2. For each repository, what is its role (API, web UI, worker, shared library, infrastructure)?
3. Does each repository expose its own real user/runtime boundary that needs a separate verifier?
4. Which repository owns `.cayos/project.json` and the capability lock?

Record approved related repositories in `.cayos/project.json`:

```json
"repositories": {
  "related": [
    { "id": "api", "role": "service", "remote": "git@github.com:org/api.git", "remoteName": "origin" }
  ]
}
```

Bind machine paths only in `.cayos/local.json`:

```json
"relatedRepositories": {
  "api": "/absolute/path/to/api"
}
```

## Per-repository verifiers

Create one `verify-<name>` skill **inside the repository it proves**. Configure all of them in committed policy:

```json
"verification": {
  "repositories": [
    {
      "repository": "primary",
      "skill": ".cursor/skills/verify-web",
      "seam": "browser",
      "sourcePaths": ["src"],
      "browser": { "mcpServer": "chrome-agent-mcp", "debugPort": 9222 }
    },
    {
      "repository": "api",
      "skill": ".cursor/skills/verify-api",
      "seam": "http",
      "sourcePaths": ["src/server.ts"]
    }
  ]
}
```

Setup must execute and preserve evidence for **at least one mapped feature per configured repository**. Hash every verifier tree, source path set, and evidence file into `.cayos/capabilities.lock.json`.

## Runtime rules

- Doctor resolves related verifier paths only through `relatedRepositories` bindings.
- `cayos-verify` runs the verifier for every repository touched by the ticket slice; never substitute one repo's HTTP check for another repo's browser seam.
- A single-repo project may keep the legacy top-level `verification.skill` shape; Doctor normalizes it to `repository: "primary"`.
