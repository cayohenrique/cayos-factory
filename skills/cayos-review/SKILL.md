---
name: cayos-review
description: Adversarial diff-first review using a risk fingerprint; re-review after any material fix.
---

# Review

Call one reviewer: `cayos-reviewer` with `{ mode: "fast"|"deep", risks: [...] }` derived from the **actual diff**, not ticket size. Keep `cayos-reviewer-small`, `-deep`, and `-spec` only as internal backends if needed.

Fingerprint from changed files, APIs, schema, auth, queues, UI, and public contracts. Localized helpers stay `fast`. Auth, migrations, public contracts, and similar risks use `deep`. See [references/risk-fingerprint.md](references/risk-fingerprint.md).

Launch **local** Task `subagent_type: "cayos-reviewer"` on `taskModelForReview(mode)`. Primary inputs: immutable ticket snapshot, acceptance criteria, `git diff` / `git diff --cached`, changed files, fast checks. Do not require the implementer's narrative.

The reviewer tries to prove the implementation wrong. Findings return by Task `resume`. After any material production-code change, review again. Mechanical-only edits may skip re-review. Stop after two unresolved correction cycles. Never edit. See [references/adversarial-review.md](references/adversarial-review.md).
