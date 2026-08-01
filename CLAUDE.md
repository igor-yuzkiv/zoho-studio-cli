# Zoho Studio CLI

A Bun + TypeScript CLI that represents Zoho CRM resources — functions, modules, fields, workflow
rules — as local files, so Zoho development fits normal engineering workflows.

Built on Commander (CLI), axios (HTTP), pino (logging), and `@inquirer/prompts` (interactive
input). A project is a directory with a `.zoho-studio/` folder; the CLI reads its settings from
there.

Run `bun run check` before handing off a change.

<!-- composable-pipeline:begin -->
## How work is done here

Route the work before loading detail:

- executable change → invoke `/composable-pipeline:run-task` before the first edit, including when
  planning turns into execution in the same session;
- unsettled approach or later execution → `/composable-pipeline:plan-work`;
- review-only request → `/composable-pipeline:review`; executable work stays in `run-task`, which
  decides whether its risk warrants an independent review.

Across all three:

- deliver the requested scope; report adjacent work instead of silently adding it;
- make routine local decisions, but surface choices that materially change behaviour, scope,
  contracts, security, data, or lasting trade-offs;
- distinguish verified facts from inference;
- report partial or unverified work as partial or unverified.

The rules, principles, coverage lenses, and operations those pipelines draw on ship with the
composable-pipeline plugin; this repository does not keep its own copy.

Project-specific artifact destinations, exemplars, verification commands, and language are in
`.claude/composable-pipeline/project-profile.yml`.
<!-- composable-pipeline:end -->

## Commands

```bash
bun run dev -- --help   # run the CLI from source
bun run check           # lint + typecheck + tests — the pre-handoff gate
bun run lint            # eslint src tests
bun run typecheck       # tsc --noEmit
bun test                # all tests
bun test tests/settings/settings.loader.spec.ts   # a single spec
bun run build           # bundle → dist/zoho-studio
bun run compile         # standalone executable → dist/zoho-studio
```

## Where things live

`src/index.ts` registers every command: `init`, `login`, `status`, `debug`, `functions:pull`,
`modules:pull`, `fields:pull`, `workflows:pull`.

```text
src/commands/    one folder per command
src/entities/    domain entities (field, function, module, workflow-rule) with their requests
src/settings/    the .zoho-studio/ project settings
src/shared/      logger, utils, and API infrastructure (auth, CRM client)
tests/           mirrors src/, .spec.ts, Bun test runner
docs/            flat and numbered, starting at 1-overview.md
```

`.claude/rules/architecture.md` is the source of truth for this layout, file naming, exports,
tests, and CLI option style. Read it before adding a file, not after.

## Project rules

- `.claude/rules/architecture.md` — folder layout, file naming, exports, tests, CLI option style
- `.claude/rules/git.md` — commit format and `ZS-<number>` task references
- `.claude/rules/documentation.md` — `docs/` is flat, numbered, and describes only shipped behavior

A new command needs a page in `docs/`, an entry in `docs/1-overview.md`, and an entry in
`README.md` — in the same change as the command itself.

Mechanical restrictions live in `.claude/settings.json`. Never work around a blocked action:
explain what was blocked and why it is needed.

## Working model

- Do not push, migrate data, or perform destructive git operations on your own.
- `wrap-up-work` always runs in this order and never starts on its own initiative:
  1. **ask for approval** — state the outcome, what was verified, and what remains, then wait;
  2. **hand off** — `project-office task:handoff --task ZS-<n> --resolution @<file>`, which
     records the resolution comment and moves the task to `ready_to_test` in one operation;
  3. **commit**.

  One approval covers both the handoff and the commit. Without it, neither happens.

## Project Office task workflow

When a request is attached to a Project Office task, read `.project-office/AGENTS.md` and use its
CLI workflow for task context, durable checkpoints, and handoff. Project Office records the work;
`/composable-pipeline:run-task` governs how the work is performed.

The assembled workflow is part of that record. Checkpoint it once the user confirms it, and
checkpoint every later deviation — see the conventions at the end of `.project-office/AGENTS.md`.
