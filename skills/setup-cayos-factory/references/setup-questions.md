# Setup questions (user-facing)

Canonical prompts for `/setup-cayos-factory`. Read this file first. Ask phases in order.

## How to phrase questions

Apply the **humanizer** skill to every prompt you show the user:

- Short sentences. Plain words. Say what you need in one breath.
- No jargon in user-facing text: skip grill, seam, subagent, inherit, capability lock, verifier, preset slug, unless the user already used that word.
- No em dashes or en dashes. Use a period, comma, or colon instead.
- Offer clear choices. Use `AskQuestion` when the host supports it.
- Keep config keys and file paths in agent notes below, not in the question unless the user asks.

Record each answer before the next phase. Technical binding details live in the linked references.

---

## Phase 1. Which repos?

### Ask the user

**1a. Main folder**

> Is this the main project folder?
>
> - Yes, use `<absolute-path>`
> - No, the main folder is: ___

**1b. One repo or many?**

> Do you ship from one repo, or from a few repos that work together?
>
> - **One repo** (usual case). Go to Phase 2.
> - **A few repos.** I'll list them next.
> - **All git repos in this folder.** Cayos scans `<folder>` for Git checkouts, keeps one per remote (skips duplicate worktrees such as `*-brain-*`), then asks you to confirm.

**1c. Other repos** (if they picked "a few repos" or "all git repos in this folder")

For **all git repos in this folder**, run discovery first:

```text
node ${CURSOR_PLUGIN_ROOT}/scripts/discover-project.mjs --scan-folder <folder> [--primary <repo-path>] [--output <report.json>]
```

Show a short table. Include any skipped duplicate checkouts from `folderScan.skippedDuplicates`. Ask them to fix anything wrong:

| Name | Folder on this machine | Remote | What is it? | Need its own test? |
|------|------------------------|--------|-------------|-------------------|
| api | `/path/to/api` | `git@github.com:org/api.git` | Backend API | Yes / No |
| web | `/path/to/web` | `git@github.com:org/web.git` | Website | Yes / No |

What it is: API, website, worker, shared library, infra, or other.

> Are these paths right? Uncheck any repo to exclude. Does each included repo need its own end-to-end test?

Only list repos they name or approve from the scan. Do not scan the whole disk or org. When they exclude a scanned repo, remove it before Phase 2.

**1d. Where config lives**

> Where should Cayos store project config (the `.cayos` folder)?
>
> - Here, in this main repo (usual case)
> - In another repo: ___

### Agent notes

When the user picks **all git repos in this folder**, use `--scan-folder` on the main project folder from Phase 1a. Prefer `--primary` when they name the main repo; otherwise the first kept checkout becomes primary. Record related repos in `.cayos/project.json`. Put local paths in `.cayos/local.json` → `relatedRepositories` using each report entry's `localPath`. See [multi-repository.md](multi-repository.md).

---

## Phase 2. Coding rules

Run discovery first (`discover-project.mjs`). See [project-discovery.md](project-discovery.md).

### Ask the user

**2a. Docs we found**

For each file (for example `AGENTS.md`, `CONTRIBUTING.md`, Cursor rules), show path, a one-line summary, and whether it still matches the code.

> For each file below: should Cayos follow it when writing code?
>
> | File | We suggest | You pick |
> |------|------------|----------|
> | `AGENTS.md` | Follow | Follow / Skip / Use Cayos template instead |
> | … | … | … |

Do not trust a filename alone. If two docs disagree, say so and ask which wins.

**2b. Missing style guide**

For each language in use (TypeScript, JavaScript, PHP, CSS, Tailwind) with no approved guide:

> We did not find a style guide for `<language>`. Copy Cayos's default into `.cayos/standards/<language>.md`?
>
> - Yes, copy the default
> - No, we don't have one
> - We already have one here: `<path>`

If they say no once, remember that. Do not ask again on every ticket.

---

## Phase 3. How the app is built

Build `.cayos/architecture.md` from docs and code. Show simple diagrams. Ask two separate questions.

### Ask the user

**3a. Is the map right?**

> Does this picture of the app match how it works today?
>
> - Yes
> - Mostly. Fixes: ___
> - No. Change it before we continue.

**3b. Default for new tickets**

> For new work, should Cayos stick to this layout unless we agree to break it?
>
> - Yes, use it as the default
> - Just for reference, not a hard rule
> - No, don't use it when planning

They can still change architecture later on purpose.

---

## Phase 4. Where tickets come from

Read only. Cayos never edits Jira, ClickUp, Linear, or similar.

### Ask the user

> Where should Cayos read tickets from?
>
> - Jira
> - ClickUp
> - Linear
> - A script in this repo (for example `node scripts/get-task.mjs`)
> - Not set up yet. Use a fake ticket for now.
> - Something else: ___

If you already found a script:

> Is `<command>` how you normally fetch a ticket by ID?
>
> - Yes
> - No. We use: ___

### Agent notes

CLI adapters need full `readCommandPatterns`. No prefix allowlists.

---

## Phase 5. Which AI models?

See [model-policy.md](model-policy.md) for how choices map to config.

### Ask the user

**5a. This chat**

> Will you run Cayos in this Cursor chat?
>
> - Yes (usual). Use whatever model I picked here.
> - No. Always use this model for Cayos in chat: ___

**5b. Background workers**

> Background workers (implementation, review, auto-mode Q&A) can use different models. What do you want?
>
> - **Balanced** (default). Fast for most work. Stronger model for hard tasks and review.
> - **One model everywhere**. Simplest. Same cost every time.
> - **Save money**. Cheaper for routine work. Better model only where it matters.
> - **I'll pick each job myself**

If they pick Balanced, One model, or Save money, only ask for the model name(s) that preset needs. Skip 5c unless they picked "I'll pick each job myself".

**5c. Pick each job** (only if they chose that)

> Which model for each job?
>
> | Job | What it does | Model |
> |-----|----------------|-------|
> | Auto-mode: questions | Asks about the ticket in one batch | ___ |
> | Auto-mode: answers | Answers from docs and code | ___ |
> | Small change | One file or small area | ___ |
> | Medium change | Several files working together | ___ |
> | Big change | Auth, migrations, big refactors | ___ |
> | Code review | Read-only check of the diff | ___ |

They can change this later with `/cayos-setup-update`.

### Agent notes

Map answers to `models.delivery` and `models.subagents.*` per model-policy.md.

---

## Phase 6. How we check that it works

### Ask the user

**6a. Type of check** (per repo if there are several)

> For `<repo name>`, how should Cayos check that a feature actually works?
>
> - Open it in the browser (typical for websites)
> - Call an API and check the response
> - Run a command and check the output
> - Run tests only (for example `npm test`)
> - A mix: ___

**6b. One real example**

> Name one small flow that already works today. We'll use it to prove setup.
>
> Examples: health check returns 200, login opens the dashboard, `npm run smoke` passes.
>
> - Use what we found: `<example from repo>`
> - Use this instead: ___

### Agent notes

Create or reuse one verify skill per repo that needs its own check. Run it once during setup and save the proof. See `create-project-verifier` and [multi-repository.md](multi-repository.md). Web UI: bind `chrome-agent-mcp` and set `seam` to `browser`.

---

## Phase 7. Save and finish

Summarize in plain language:

- Main repo and any others (paths, roles, tests)
- Which docs Cayos follows
- Architecture default yes/no
- Ticket source
- Model choice
- How you check that features work

### Ask the user

> Save this setup, run the checks, and lock the config?
>
> - Yes, go ahead
> - No. Change phase: ___

### Agent notes

Write `.cayos/project.json` and `.cayos/local.json` (`autoMerge: false`). Hash into `.cayos/capabilities.lock.json`. Run Doctor full. Setup succeeds only at READY. If not READY, say exactly what failed.

---

## Do not ask during default setup

- Extra per-agent model overrides unless they ask
- Evaluator model (plugin tests only)
- Auto-merge PRs (always off)
- File permission during implementation (handled elsewhere)
