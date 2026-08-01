# Overview

Zoho Studio CLI is a command-line tool for working with Zoho platform resources as local files, so
Zoho development fits normal software engineering workflows — version control, scripts, and
agent-driven automation.

A **project** is any folder containing `.zoho-studio/settings.json`. That single file holds
everything the CLI needs: which Zoho account to talk to, which API to call, and the credentials to
do it with. `zoho-studio init` scaffolds the project around it.

Everything the CLI downloads lands under `src/`, at paths it fixes and no setting moves —
`src/functions`, `src/modules`, `src/workflows`.

## Running the CLI

The CLI runs from source:

```bash
bun install
bun run dev -- --help
bun run dev -- init my-project
```

`bun run build` produces a bundle in `dist/`, and `bun run compile` a standalone executable. Both
are invoked as `zoho-studio`, which is the name used throughout these documents.

## Documents

- [2-settings.md](2-settings.md) — the settings file, and how the CLI reads and writes it
- [3-init-command.md](3-init-command.md) — scaffolding a project with `zoho-studio init`
- [4-login-command.md](4-login-command.md) — authorizing a project with `zoho-studio login`
- [5-status-command.md](5-status-command.md) — checking the connection with `zoho-studio status`
- [6-functions-pull-command.md](6-functions-pull-command.md) — downloading functions with `zoho-studio functions:pull`
- [7-modules-pull-command.md](7-modules-pull-command.md) — downloading module metadata with `zoho-studio modules:pull`
- [8-fields-pull-command.md](8-fields-pull-command.md) — downloading module fields with `zoho-studio fields:pull`
- [9-workflows-pull-command.md](9-workflows-pull-command.md) — downloading workflow rules with `zoho-studio workflows:pull`
