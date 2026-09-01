# Per-repository verifier creation

Read [../../setup-cayos-factory/references/multi-repository.md](../../setup-cayos-factory/references/multi-repository.md) when more than one repository is in scope.

Create one verifier per repository that exposes a real runtime boundary:

1. Confirm the target repository ID (`primary` or a declared related ID).
2. Inspect only that repository's runtime, scripts, ports, dependencies, and seams.
3. Create `.cursor/skills/verify-<name>/SKILL.md` **inside that repository** with Launch, Doctor, Drive, Evidence, Cleanup, Helpers, and `features/README.md`.
4. Add the entry to `.cayos/project.json` under `verification.repositories` without removing other repository verifiers.
5. Prove one mapped feature in that repository and preserve evidence under the primary `.cayos` run or that repository's evidence path as documented in the skill.

When the seam is web UI, follow [web-browser-verification.md](web-browser-verification.md) for that repository entry only.
