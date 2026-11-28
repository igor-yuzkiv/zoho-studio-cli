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

`zoho-studio --help` then lists the commands, and `zoho-studio --version` prints the installed version. Pull the repository and run `bun run compile` again
to update; the link from `bun run link` follows the sources and needs no update. New to the tool?
Start with the [user guide](docs/en/guides/README.md) ([українською](docs/ua/guides/README.md)).

## Documentation

- [Overview](docs/en/reference/README.md) — what a project is, and how to run the CLI
- [Project settings](docs/en/reference/project/settings.md) — `.zoho-studio/settings.json` and how the CLI reads it
- [init](docs/en/reference/project/init.md) — scaffolding a project with `zoho-studio init`
- [login](docs/en/reference/project/login.md) — authorizing a project with `zoho-studio login`
- [z-crm:status](docs/en/reference/crm-org/status.md) — checking the connection with `zoho-studio z-crm:status`
- [z-crm:functions:pull](docs/en/reference/crm-functions/pull.md) — downloading functions
- [z-crm:modules:pull](docs/en/reference/crm-metadata/modules.md) — downloading module metadata
- [z-crm:fields:pull](docs/en/reference/crm-metadata/fields.md) — downloading module fields
- [z-crm:layouts:pull](docs/en/reference/crm-metadata/layouts.md) — downloading module layouts with their sections and formulas
- [z-crm:functions:make](docs/en/reference/crm-functions/make.md) — scaffolding a new Deluge function in `src/`, or importing a pulled one
- [z-crm:functions:import](docs/en/reference/crm-functions/import.md) — copying a pulled function from `data/` into `src/`
- [z-crm:functions:deploy](docs/en/reference/crm-functions/deploy.md) — creating or updating a function in Zoho from `src/`
- [z-crm:functions:run](docs/en/reference/crm-functions/run.md) — running a function's code from `src/` or `data/` in Zoho and printing the result
- [z-crm:migrations:make](docs/en/reference/crm-migrations/make.md) — creating a migration file through a few questions
- [z-crm:widgets:make](docs/en/reference/crm-widgets/make.md) — creating a widget folder with a scenario and a Playwright test
- [z-crm:widgets:serve](docs/en/reference/crm-widgets/serve.md) — running widgets in an emulated Zoho CRM with mocked SDK answers
- [z-crm:workflows:pull](docs/en/reference/crm-metadata/workflows.md) — downloading workflow rules
- [z-crm:org:info](docs/en/reference/crm-org/org-info.md) — reading the organization and storing it in the project
- [z-crm:workflow-actions:pull](docs/en/reference/crm-metadata/workflow-actions.md) — downloading workflow actions
- [z-crm:webhooks:pull](docs/en/reference/crm-metadata/webhooks.md) — downloading webhooks
- [z-crm:global-picklists:pull](docs/en/reference/crm-metadata/global-picklists.md) — downloading global picklists
- [z-crm:profiles:pull](docs/en/reference/crm-metadata/profiles.md) — downloading profiles
- [z-crm:client-scripts:pull](docs/en/reference/crm-metadata/client-scripts.md) — downloading client scripts
- [z-crm:static-resources:pull](docs/en/reference/crm-metadata/static-resources.md) — downloading static resources
- [preset](docs/en/reference/project/preset.md) — running a named sequence of commands
- [browser](docs/en/reference/project/browser.md) — browsing the artifacts and running pulls in a local web app

## Scripts in a project

A project made by `zoho-studio init` comes with a `package.json` that links the framework packages
(`@zoho-studio/core`, `@zoho-studio/auth`, `@zoho-studio/zoho-crm`)
and a `scripts/example.ts` to copy. Run `bun run link` once in this repository, then `bun install`
in the project; see [init](docs/en/reference/project/init.md#scripts).

`bun run migrate` in a project creates Zoho CRM modules and adds fields from the files in
`migrations/zoho-crm/`; see [migrations](docs/en/reference/crm-migrations/migrations.md). `zoho-studio z-crm:migrations:make`
starts a new migration file.

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
