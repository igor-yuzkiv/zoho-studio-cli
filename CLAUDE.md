# Zoho Studio CLI

A Bun + TypeScript CLI that represents Zoho CRM resources — functions, modules, fields, workflow
rules — as local files, so Zoho development fits normal engineering workflows.

A project is a directory with a `.zoho-studio/` folder; the CLI reads its settings from there.

Run `bun run check` before handing off a change.

## Project rules

- `.claude/rules/architecture.md` — folder layout, file naming, exports, tests, CLI option style
- `.claude/rules/git.md` — branches (`feature/*` → `develop` → `master` on release), commit format
- `.claude/rules/documentation.md` — `docs/<en|ua>/` with guides, reference, architecture, and ADRs; both languages, only shipped behavior
- `.claude/rules/zoho-findings.md` — record how Zoho really behaves in `zoho-findings/`
- `.claude/rules/versioning.md` — one version for the repository, releases only through `/release`
- `.claude/rules/instructions.md` — what goes into `zoho-studio instructions` and keeping it true to the code
- `.claude/rules/skills.md` — how skills of the plugin and of this repository are written; `write-skill` applies it
- `.claude/rules/translation.md` — the Ukrainian mirror `plugins-ua/` of the plugin

A new command needs a page in `docs/<lang>/reference/`, an entry in the reference index, an
entry in `README.md` and `README.ua.md` — in both languages — and its agent instructions in
`apps/cli/src/commands/instructions/texts/`, in the same change as the command itself. A changed
command updates its docs and its instructions text together.

Mechanical restrictions live in `.claude/settings.json`. Never work around a blocked action:
explain what was blocked and why it is needed.

## What leaves this machine

The agent may push when the person asks for it or agrees to it. A push, a pull request, a
release, or a message to a client happens on an explicit instruction and is announced before it
is sent.

A task key may go into a commit message (see `.claude/rules/git.md`). Task states, session names, and local paths
stay in the tracker and the chat; they do not appear in commit messages, code comments,
client-facing documents, or mockups.
