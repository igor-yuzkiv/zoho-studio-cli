# Zoho Studio CLI

A Bun + TypeScript CLI that represents Zoho CRM resources — functions, modules, fields, workflow
rules — as local files, so Zoho development fits normal engineering workflows.

A project is a directory with a `.zoho-studio/` folder; the CLI reads its settings from there.

Run `bun run check` before handing off a change.

## Project rules

- `.claude/rules/architecture.md` — folder layout, file naming, exports, tests, CLI option style
- `.claude/rules/git.md` — commit format and `ZS-<number>` task references
- `.claude/rules/documentation.md` — `docs/` is flat, numbered, and describes only shipped behavior

A new command needs a page in `docs/`, an entry in `docs/1-overview.md`, and an entry in
`README.md` — in the same change as the command itself.

Mechanical restrictions live in `.claude/settings.json`. Never work around a blocked action:
explain what was blocked and why it is needed.

## Project Office task workflow

When a request is attached to a Project Office task, read `.project-office/AGENTS.md` and use its
CLI workflow for task context, durable checkpoints, and handoff. Project Office records the work;
`/composable-pipeline:run-task` governs how the work is performed.

The assembled workflow is part of that record. Checkpoint it once the user confirms it, and
checkpoint every later deviation — see the conventions at the end of `.project-office/AGENTS.md`.
