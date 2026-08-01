# Project Office

Guidance for Claude Code when working in this repository.

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

## Project

A Bun + TypeScript CLI that represents Zoho CRM resources — functions, modules, fields, workflow
rules — as local files, so Zoho development fits normal engineering workflows.

Run `bun run check` (lint + typecheck + tests) before handing off a change.

## Commands

```bash
bun run dev -- --help   # run the CLI from source
bun run check           # lint + typecheck + tests
bun test tests/settings/settings.loader.spec.ts   # a single spec
bun run build           # bundle → dist/zoho-studio
bun run compile         # standalone executable → dist/zoho-studio
```

## Working model

- Do not push, migrate data, or perform destructive git operations on your own.
- The user reviews the final diff and visually verifies UI changes. Do not add a mandatory agent
  review.
- `wrap-up-work` always runs in this order and never starts on its own initiative:
  1. **ask for approval** — state the outcome, what was verified, and what remains, then wait;
  2. **hand off** — `project-office task:handoff --task ZS-<n> --resolution @<file>`, which
     records the resolution comment and moves the task to `ready_to_test` in one operation;
  3. **commit**.

  One approval covers both the handoff and the commit. Without it, neither happens.
- Backend and frontend contracts are one change: keep Resources, request shapes, and frontend
  types aligned when both sides are in scope.

## Project rules

- `.claude/rules/architecture.md` — folder layout, file naming, exports, tests, CLI option style
- `.claude/rules/git.md` — commit format and `ZS-<number>` task references
- `.claude/rules/documentation.md` — `docs/` is flat, numbered, and describes only shipped behavior
- `docs/1-overview.md` — the user-facing entry point; a new command needs a page there, plus an
  entry in that overview and in `README.md`

Mechanical restrictions and automatic formatting live in `.claude/settings.json` and
`.claude/hooks/`. Never work around a blocked action. Explain what was blocked and why it is
needed.

## Project Office task workflow

When a request is attached to a Project Office task, read `.project-office/AGENTS.md` and use its
CLI workflow for task context, durable checkpoints, and handoff. Project Office records the work;
`/composable-pipeline:run-task` governs how the work is performed.
