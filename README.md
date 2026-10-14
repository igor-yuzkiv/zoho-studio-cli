# Zoho CRM Studio CLI

Українською: [README.ua.md](README.ua.md)

Zoho Studio CLI is a developer-focused command-line tool for working with Zoho platform resources, configuration, metadata, and code.

The project aims to bring Zoho development closer to conventional software engineering workflows by representing remote resources in a structured, local, and automation-friendly form.

It is designed for both developers and AI agents, providing a predictable interface for inspecting, managing, and processing Zoho project artifacts through scripts, development tools, and agent-driven workflows.

## Getting the CLI

The CLI is built from this repository; there are no prebuilt releases. It needs
[Bun](https://bun.sh) 1.3 or newer.

```bash
git clone <this repository> zoho-studio-cli
cd zoho-studio-cli
bun install
bun run compile                              # → dist/zoho-studio, with the web app inside
ln -s "$PWD/dist/zoho-studio" ~/.local/bin/zoho-studio   # or any folder on your PATH
bun run link                                 # once, so projects can import the packages
```

`zoho-studio --help` then lists the commands. Pull the repository and run `bun run compile` again
to update; the link from `bun run link` follows the sources and needs no update. New to the tool?
Start with the [user guide](docs/en/user-guide/1-overview.md) ([українською](docs/ua/user-guide/1-overview.md)).

## Documentation

- [Overview](docs/en/technical/1-overview.md) — what a project is, and how to run the CLI
- [Project settings](docs/en/technical/2-settings.md) — `.zoho-studio/settings.json` and how the CLI reads it
- [init](docs/en/technical/3-init-command.md) — scaffolding a project with `zoho-studio init`
- [login](docs/en/technical/4-login-command.md) — authorizing a project with `zoho-studio login`
- [z-crm:status](docs/en/technical/5-status-command.md) — checking the connection with `zoho-studio z-crm:status`
- [z-crm:functions:pull](docs/en/technical/6-functions-pull-command.md) — downloading functions
- [z-crm:modules:pull](docs/en/technical/7-modules-pull-command.md) — downloading module metadata
- [z-crm:fields:pull](docs/en/technical/8-fields-pull-command.md) — downloading module fields
- [z-crm:layouts:pull](docs/en/technical/28-layouts-pull-command.md) — downloading module layouts with their sections and formulas
- [z-crm:workflows:pull](docs/en/technical/9-workflows-pull-command.md) — downloading workflow rules
- [z-crm:org:info](docs/en/technical/10-org-info-command.md) — reading the organization and storing it in the project
- [z-crm:workflow-actions:pull](docs/en/technical/11-workflow-actions-pull-command.md) — downloading workflow actions
- [z-crm:webhooks:pull](docs/en/technical/12-webhooks-pull-command.md) — downloading webhooks
- [z-crm:global-picklists:pull](docs/en/technical/13-global-picklists-pull-command.md) — downloading global picklists
- [z-crm:profiles:pull](docs/en/technical/26-profiles-pull-command.md) — downloading profiles
- [z-crm:client-scripts:pull](docs/en/technical/22-client-scripts-pull-command.md) — downloading client scripts
- [z-crm:static-resources:pull](docs/en/technical/23-static-resources-pull-command.md) — downloading static resources
- [preset](docs/en/technical/24-preset-command.md) — running a named sequence of commands
- [browser](docs/en/technical/25-browser-command.md) — browsing the artifacts and running pulls in a local web app

## Scripts in a project

A project made by `zoho-studio init` comes with a `package.json` that links the framework packages
(`@zoho-studio/core`, `@zoho-studio/auth`, `@zoho-studio/zoho-crm`)
and a `scripts/example.ts` to copy. Run `bun run link` once in this repository, then `bun install`
in the project; see [init](docs/en/technical/3-init-command.md#scripts).

`bun run migrate` in a project creates Zoho CRM modules and adds fields from the files in
`migrations/zoho-crm/`; see [migrations](docs/en/technical/27-migrations.md).

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
bun run compile         # web app + standalone executable with the page embedded → dist/
bun run link            # register packages/* in Bun's link registry, for projects made by `init`
bun run unlink          # remove that registration
bun run dev:web         # web app dev server (Vite)
bun run build:web       # web app build → dist/web
```
