---
name: scripts
description: Solves a task the zoho-studio CLI has no command for — or one that would take many commands — with a TypeScript script in the project's scripts/ on the @zoho-studio/* packages ("code mode"): pull or analyse Zoho CRM data in a specific way, a report, a bulk check, a one-off change. Use when the person asks for something the CLI cannot do, asks to "script it", or when you are about to chain several CLI commands or call the Zoho REST API by hand.
---

# Scripts

When the CLI has no command for what the person needs, write a script on the same packages the CLI is built from: they already know the project, the login and the file layout. What the CLI can do and what it cannot is in `zoho-studio instructions`; check there first, a command is better than a script. The packages' API is in their READMEs, not here.

## Goal

The person got the result of a script they saw and agreed to run, and the script changed the organization only if the person asked for a change.

## Workflow

1. **Check there is no command.** `zoho-studio instructions` (and the group the task belongs to): if a command does it, use the command instead.
2. **Check the packages are reachable.** `node_modules/@zoho-studio/zoho-crm/README.md` exists in the project. Missing — `bun install` in the project, with the person's agreement. `bun install` fails on the `link:` dependencies — the CLI was not installed from its clone on this machine: offer `/zoho-studio:setup`.
3. **Read the API.** Start from `node_modules/@zoho-studio/zoho-crm/README.md` and `node_modules/@zoho-studio/core/README.md`, then follow the imports into the sources and their `*.types.ts`. Search tools skip `node_modules`, so open these paths directly. The folder is a link into the zoho-studio clone, outside the project: Claude Code may ask the person once to allow reading there — tell them why. For Zoho facts the packages do not cover — an endpoint, COQL, a field of an answer — use `/zoho-studio:sources`.
4. **Write the script** in `scripts/<what-it-does>.ts`. It reads by default: the CRM client refuses any request that can change the organization. Call `allowCrmWrites()` only when the person asked for a change, right before the writes, after printing which organization the script writes to (`getOrganizationRequest()`). Prefer pulled files under `data/` over requests when they hold what is needed. Check the endpoints the script calls are covered by `auth.scopes` in `.zoho-studio/settings.json` (the scope an endpoint needs is in its Zoho reference, see `/zoho-studio:sources`). Check it compiles: `bunx tsc --noEmit`.
5. **Show it and get the run approved.** Tell the person in a few lines what the script reads, what it writes — to files and to Zoho — and on which organization; for a script that writes, name each change. Run `bun run scripts/<name>.ts` only after they agree; a new project asks before each script run on its own.
6. **Report the result** — what the script found or changed, where it wrote files — and offer to keep the script in git or delete it.

## Rules

- **A missing scope is the person's to add.** When the script needs a scope the project lacks — known in advance, or Zoho rejects a request naming a scope — tell the person which scope and why, and that the fix is to add it to `auth.scopes` in `.zoho-studio/settings.json` and run `zoho-studio login` again (Zoho fixes scopes at consent; see `zoho-studio instructions login`). Do not change the scopes or run `login` yourself: it widens what the project may do in their organization, and consent is theirs.
- Writes to Zoho happen only on the person's request for that change: a script that was meant to read fails with `CRM_WRITES_DISABLED` instead of writing, so do not add `allowCrmWrites()` to make an error go away — ask.
- Prefer a sandbox organization for a script that writes; on a production organization say so before the run.
- Keep personal data out of the output and the files: print counts and IDs rather than names and emails, unless the person needs them.
- The script lives in the project and runs from its folder; do not copy package code into it — import it.

## Output

- The script's path and what it does, before the run.
- After the run: the result, the files written, the changes made in Zoho if any.
