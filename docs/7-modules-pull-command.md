# `zoho-studio modules:pull`

Downloads the metadata of every Zoho CRM module of the organization into `src/modules/` —
one directory per module, holding its metadata file.

```bash
zoho-studio modules:pull
```

```text
Modules found: 42
Metadata saved: 42
```

The command needs a project that has been through [`zoho-studio login`](4-login-command.md), with
the `ZohoCRM.settings.modules.READ` scope granted.

## What lands on disk

Files are written under the project root — the folder holding `.zoho-studio/`, not the current
directory.

```text
src/modules/
├── Leads/
│   └── Leads.metadata.json
└── CustomModule1/
    └── CustomModule1.metadata.json
```

Both the directory and the file are named after the module's API name, not its display name. The
API name is stable and unique, and it stays the same when the display name is renamed in Zoho. Only
characters a path segment cannot contain are replaced; nothing else about the name is changed.

`*.metadata.json` holds the full module record exactly as the endpoint returned it, formatted with a
four-space indent and a trailing newline.

**The target directory is deleted and recreated on every run.** It always reflects the current pull,
so a module removed in Zoho disappears locally, and any local edit inside it is lost.

That includes the fields [`zoho-studio fields:pull`](8-fields-pull-command.md) writes into
`<module>/fields/`: this command wipes them along with everything else. The order is always
`modules:pull` first, `fields:pull` after.

The location is fixed: `src/modules/` under the project root, created if it is not there. No
setting moves it — see [`zoho-studio init`](3-init-command.md) for the project tree.

## Failures

The whole command is a single request, so failing to fetch the module list is fatal — there would be
nothing to write, and the existing directory is left untouched because it is wiped only after the
list arrives.

## Logs

The CLI writes structured JSON logs to [`logs.file`](2-settings.md), `logs/zoho-studio-cli.log` by
default, created on the first line written. `modules:pull` records the start of the run, how many
modules were found, and the final count. Tokens and authorization headers are never logged.
