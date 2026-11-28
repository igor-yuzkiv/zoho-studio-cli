# Reference

Українська версія: [ua](../../ua/reference/README.md)

Zoho Studio CLI is a command-line tool for working with Zoho platform resources as local files, so
Zoho development fits normal software engineering workflows — version control, scripts, and
agent-driven automation.

A **project** is any folder containing `.zoho-studio/settings.json`. That single file holds
everything the CLI needs to know about the project: which data center to talk to, which API to
call, and which scopes to ask for. The credentials stay outside the project, in `~/.zoho-studio`,
where several projects can share one client. `zoho-studio init` scaffolds the project around it.

Everything the CLI downloads lands under `data/`, in a folder per Zoho product, at paths it fixes
and no setting moves — `data/zoho-crm/functions`, `data/zoho-crm/modules` (each module's fields and layouts in
its own `fields/` and `layouts/` folders), `data/zoho-crm/workflows`, `data/zoho-crm/workflow-actions`,
`data/zoho-crm/webhooks`, `data/zoho-crm/global-picklists`, `data/zoho-crm/profiles`,
`data/zoho-crm/client-scripts`, `data/zoho-crm/static-resources`.

This folder holds the technical reference, one page per command. To learn the tool task by task,
read the [user guide](../guides/README.md) ([українською](../../ua/guides/README.md)).

## Running the CLI

The CLI runs from source:

```bash
bun install
bun run dev -- --help
bun run dev -- init my-project
```

`bun run build` produces a bundle in `dist/`, and `bun run compile` a standalone executable with the
web page of `zoho-studio browser` built in, `dist/zoho-studio`. Put it on your `PATH` to call it as
`zoho-studio`, which is the name used throughout these documents — see the README.
`zoho-studio --version` (or `-V`) prints the version of the CLI.

## Documents

- [Glossary](../glossary.md) — the terms used throughout: artifact, pull, snapshot, source, scaffold, import, deploy

### Project

- [Settings](project/settings.md) — the settings file, and how the CLI reads and writes it
- [`zoho-studio init`](project/init.md) — scaffolding a project with `zoho-studio init`
- [`zoho-studio login`](project/login.md) — authorizing a project with `zoho-studio login`
- [`zoho-studio preset`](project/preset.md) — running a named sequence of commands with `zoho-studio preset`
- [`zoho-studio browser`](project/browser.md) — browsing the artifacts and running pulls in a local web app with `zoho-studio browser`
- [`zoho-studio instructions`](project/instructions.md) — instructions for AI agents: the project, a group of commands, or one command, with `zoho-studio instructions`

### CRM organization

- [`zoho-studio z-crm:status`](crm-org/status.md) — checking the connection with `zoho-studio z-crm:status`
- [`zoho-studio z-crm:org:info`](crm-org/org-info.md) — reading and storing the organization with `zoho-studio z-crm:org:info`

### CRM metadata

- [`zoho-studio z-crm:modules:pull`](crm-metadata/modules.md) — downloading module metadata with `zoho-studio z-crm:modules:pull`
- [`zoho-studio z-crm:fields:pull`](crm-metadata/fields.md) — downloading module fields with `zoho-studio z-crm:fields:pull`
- [`zoho-studio z-crm:layouts:pull`](crm-metadata/layouts.md) — downloading module layouts, with their sections and formulas, with `zoho-studio z-crm:layouts:pull`
- [`zoho-studio z-crm:workflows:pull`](crm-metadata/workflows.md) — downloading workflow rules with `zoho-studio z-crm:workflows:pull`
- [`zoho-studio z-crm:workflow-actions:pull`](crm-metadata/workflow-actions.md) — downloading workflow actions with `zoho-studio z-crm:workflow-actions:pull`
- [`zoho-studio z-crm:webhooks:pull`](crm-metadata/webhooks.md) — downloading webhooks with `zoho-studio z-crm:webhooks:pull`
- [`zoho-studio z-crm:global-picklists:pull`](crm-metadata/global-picklists.md) — downloading global picklists with `zoho-studio z-crm:global-picklists:pull`
- [`zoho-studio z-crm:profiles:pull`](crm-metadata/profiles.md) — downloading profiles with `zoho-studio z-crm:profiles:pull`
- [`zoho-studio z-crm:client-scripts:pull`](crm-metadata/client-scripts.md) — downloading client scripts with `zoho-studio z-crm:client-scripts:pull`
- [`zoho-studio z-crm:static-resources:pull`](crm-metadata/static-resources.md) — downloading static resources with `zoho-studio z-crm:static-resources:pull`

### CRM functions

- [`zoho-studio z-crm:functions:pull`](crm-functions/pull.md) — downloading functions with `zoho-studio z-crm:functions:pull`
- [`zoho-studio z-crm:functions:make`](crm-functions/make.md) — scaffolding a new Deluge function in `src/`, or importing a pulled one, with `zoho-studio z-crm:functions:make`
- [`zoho-studio z-crm:functions:import`](crm-functions/import.md) — copying a pulled function from `data/` into `src/` with `zoho-studio z-crm:functions:import`
- [`zoho-studio z-crm:functions:deploy`](crm-functions/deploy.md) — creating or updating a function in Zoho from `src/` with `zoho-studio z-crm:functions:deploy`
- [`zoho-studio z-crm:functions:run`](crm-functions/run.md) — running a function's code from `src/` or `data/` in Zoho with `zoho-studio z-crm:functions:run`

### CRM migrations

- [Migrations](crm-migrations/migrations.md) — creating modules and adding fields from migration files with `bun run migrate`
- [`zoho-studio z-crm:migrations:make`](crm-migrations/make.md) — creating a migration file through a few questions with `zoho-studio z-crm:migrations:make`

### CRM widgets

- [`zoho-studio z-crm:widgets:make`](crm-widgets/make.md) — creating a widget folder that runs as is with `zoho-studio z-crm:widgets:make`
- [`zoho-studio z-crm:widgets:serve`](crm-widgets/serve.md) — running widgets in an emulated Zoho CRM, scenarios and e2e tests with `zoho-studio z-crm:widgets:serve`
