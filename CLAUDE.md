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

A new command needs a page in `docs/<lang>/reference/`, an entry in the reference index, and an
entry in `README.md` and `README.ua.md` — in both languages, in the same change as the command
itself.

Mechanical restrictions live in `.claude/settings.json`. Never work around a blocked action:
explain what was blocked and why it is needed.

## What leaves this machine

The agent may push when the person asks for it or agrees to it. A push, a pull request, a
release, or a message to a client happens on an explicit instruction and is announced before it
is sent.

A task key may go into a commit message (see `.claude/rules/git.md`). Task states, session names, and local paths
stay in the tracker and the chat; they do not appear in commit messages, code comments,
client-facing documents, or mockups.
