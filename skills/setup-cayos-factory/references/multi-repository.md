# Multi-repository verification

Use when Phase 1b = **Several repositories** or **All git repos in this folder**, or tickets routinely touch multiple runtimes. User-facing prompts: [setup-questions.md](setup-questions.md) Phase 1c–1d and Phase 6.

For folder scans, discovery keeps one checkout per `origin` remote and reports skipped duplicates in `folderScan.skippedDuplicates`. The user confirms the kept list in Phase 1c before standards discovery.

## Record in config

Approved related repositories in committed `.cayos/project.json`:

```json
"repositories": {
  "related": [
    { "id": "api", "role": "service", "remote": "git@github.com:org/api.git", "remoteName": "origin" }
  ]
}
```

Machine paths only in `.cayos/local.json`:

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
