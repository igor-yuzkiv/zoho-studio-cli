# Zoho CRM Studio CLI

Zoho Studio CLI is a developer-focused command-line tool for working with Zoho platform resources, configuration, metadata, and code.

The project aims to bring Zoho development closer to conventional software engineering workflows by representing remote resources in a structured, local, and automation-friendly form.

It is designed for both developers and AI agents, providing a predictable interface for inspecting, managing, and processing Zoho project artifacts through scripts, development tools, and agent-driven workflows.

## Documentation

- [Overview](docs/1-overview.md) — what a project is, and how to run the CLI
- [Project settings](docs/2-settings.md) — `.zoho-studio/settings.json` and how the CLI reads it
- [init](docs/3-init-command.md) — scaffolding a project with `zoho-studio init`
- [login](docs/4-login-command.md) — authorizing a project with `zoho-studio login`
- [z-crm:status](docs/5-status-command.md) — checking the connection with `zoho-studio z-crm:status`
- [z-crm:functions:pull](docs/6-functions-pull-command.md) — downloading functions
- [z-crm:modules:pull](docs/7-modules-pull-command.md) — downloading module metadata
- [z-crm:fields:pull](docs/8-fields-pull-command.md) — downloading module fields
- [z-crm:workflows:pull](docs/9-workflows-pull-command.md) — downloading workflow rules
- [z-crm:org:info](docs/10-org-info-command.md) — reading the organization and storing it in the project
- [z-crm:workflow-actions:pull](docs/11-workflow-actions-pull-command.md) — downloading workflow actions
- [z-crm:webhooks:pull](docs/12-webhooks-pull-command.md) — downloading webhooks
- [z-crm:global-picklists:pull](docs/13-global-picklists-pull-command.md) — downloading global picklists
- [z-projects:milestones:pull](docs/16-z-projects-milestones-pull-command.md) — downloading Zoho Projects milestones as raw JSON
- [z-projects:task-lists:pull](docs/17-z-projects-task-lists-pull-command.md) — downloading Zoho Projects task lists under their milestones
- [z-projects:tasks:pull](docs/18-z-projects-tasks-pull-command.md) — downloading Zoho Projects tasks by period, with their comments
- [z-projects:tasks:render](docs/19-z-projects-tasks-render-command.md) — building an Obsidian markdown catalogue from the raw Zoho Projects JSON
- [Skills](docs/15-skills.md) — agent-facing skills shipped with the CLI, and installing them

## Editor support

Pulled functions are saved as `.deluge` files. For syntax highlighting, IntelliSense, and hover
docs on Zoho's built-in functions, install
[Deluge Language Support](https://marketplace.visualstudio.com/items?itemName=BagaduceDigital.deluge-lang)
by OldPine Digital — it registers both `.deluge` and `.ds`, so it picks the files up as they are.

## Commands

```bash
bun install             # dependencies
bun run dev -- --help   # run CLI from source
bun run lint            # eslint
bun run typecheck       # tsc --noEmit
bun test                # tests
bun run check           # lint + typecheck + tests
bun run build           # bun-targeted bundle → dist/
bun run compile         # standalone executable → dist/
bun run deploy-skills   # install skills/ into ~/.claude/skills/
```
