# Zoho Studio CLI

A Bun + TypeScript CLI that represents Zoho CRM resources — functions, modules, fields, workflow
rules — as local files, so Zoho development fits normal engineering workflows.

A project is a directory with a `.zoho-studio/` folder; the CLI reads its settings from there.

Run `bun run check` before handing off a change.

## Project rules

- `.claude/rules/architecture.md` — folder layout, file naming, exports, tests, CLI option style
- `.claude/rules/git.md` — commit format and `ZS-<number>` task references
- `.claude/rules/documentation.md` — `docs/<en|ua>/<user-guide|technical>/`, both languages, only shipped behavior
- `.claude/rules/zoho-findings.md` — record how Zoho really behaves in `zoho-findings/`

A new command needs a page in `docs/<lang>/technical/`, an entry in its `1-overview.md`, and an
entry in `README.md` and `README.ua.md` — in both languages, in the same change as the command
itself.

Mechanical restrictions live in `.claude/settings.json`. Never work around a blocked action:
explain what was blocked and why it is needed.

## Project Office task workflow

When a request is attached to a Project Office task, read `.project-office/AGENTS.md` and use its
CLI workflow for task context, durable checkpoints, and handoff. Project Office records the work;
`/composable-pipeline:run-task` governs how the work is performed.

The assembled workflow is part of that record. Checkpoint it once the user confirms it, and
checkpoint every later deviation — see the conventions at the end of `.project-office/AGENTS.md`.

## What leaves this machine

The agent commits; the person pushes. A push, a pull request, a release, or a message to a
client happens on an explicit instruction and is announced before it is sent.

A commit carries no agent attribution: no `Co-Authored-By` trailer, no session link.

This repository is personal, so a Project Office task key may go into a commit message, as the
last line of the body (see `.claude/rules/git.md`). Checkpoints, session names, and local paths
stay in the board and the chat; they do not appear in commit messages, code comments,
client-facing documents, or mockups.
