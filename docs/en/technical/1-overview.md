# Overview

Українська версія: [ua](../../ua/technical/1-overview.md)

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
read the [user guide](../user-guide/1-overview.md) ([українською](../../ua/user-guide/1-overview.md)).

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

## Documents

- [glossary.md](../glossary.md) — the terms used throughout: artifact, pull, snapshot, source, scaffold
- [2-settings.md](2-settings.md) — the settings file, and how the CLI reads and writes it
- [3-init-command.md](3-init-command.md) — scaffolding a project with `zoho-studio init`
- [4-login-command.md](4-login-command.md) — authorizing a project with `zoho-studio login`
- [5-status-command.md](5-status-command.md) — checking the connection with `zoho-studio z-crm:status`
- [6-functions-pull-command.md](6-functions-pull-command.md) — downloading functions with `zoho-studio z-crm:functions:pull`
- [7-modules-pull-command.md](7-modules-pull-command.md) — downloading module metadata with `zoho-studio z-crm:modules:pull`
- [8-fields-pull-command.md](8-fields-pull-command.md) — downloading module fields with `zoho-studio z-crm:fields:pull`
- [9-workflows-pull-command.md](9-workflows-pull-command.md) — downloading workflow rules with `zoho-studio z-crm:workflows:pull`
- [10-org-info-command.md](10-org-info-command.md) — reading and storing the organization with `zoho-studio z-crm:org:info`
- [11-workflow-actions-pull-command.md](11-workflow-actions-pull-command.md) — downloading workflow actions with `zoho-studio z-crm:workflow-actions:pull`
- [12-webhooks-pull-command.md](12-webhooks-pull-command.md) — downloading webhooks with `zoho-studio z-crm:webhooks:pull`
- [13-global-picklists-pull-command.md](13-global-picklists-pull-command.md) — downloading global picklists with `zoho-studio z-crm:global-picklists:pull`
- [22-client-scripts-pull-command.md](22-client-scripts-pull-command.md) — downloading client scripts with `zoho-studio z-crm:client-scripts:pull`
- [23-static-resources-pull-command.md](23-static-resources-pull-command.md) — downloading static resources with `zoho-studio z-crm:static-resources:pull`
- [24-preset-command.md](24-preset-command.md) — running a named sequence of commands with `zoho-studio preset`
- [25-browser-command.md](25-browser-command.md) — browsing the artifacts and running pulls in a local web app with `zoho-studio browser`
- [26-profiles-pull-command.md](26-profiles-pull-command.md) — downloading profiles with `zoho-studio z-crm:profiles:pull`
- [27-migrations.md](27-migrations.md) — creating modules and adding fields from migration files with `bun run migrate`
- [28-layouts-pull-command.md](28-layouts-pull-command.md) — downloading module layouts, with their sections and formulas, with `zoho-studio z-crm:layouts:pull`
- [29-functions-make-command.md](29-functions-make-command.md) — scaffolding a new Deluge function in `src/` with `zoho-studio z-crm:functions:make`
