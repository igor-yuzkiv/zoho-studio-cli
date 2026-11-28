# `zoho-studio z-crm:modules:pull`

Downloads the metadata of every Zoho CRM module of the organization into `data/zoho-crm/modules/` —
one directory per module, holding its metadata file.

```bash
zoho-studio z-crm:modules:pull
```

```text
Pulling modules |████████████████████| 42/42 | Vendors
Modules found: 42
Metadata saved: 42
```

The command needs a project that has been through [`zoho-studio login`](../project/login.md), with
the `ZohoCRM.settings.modules.READ` scope granted.

## What lands on disk

Files are written under the project root — the folder holding `.zoho-studio/`, not the current
directory.

```text
data/zoho-crm/modules/
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

**This command owns only the metadata file of each module.** The fields [`zoho-studio z-crm:fields:pull`](fields.md) writes into `<module>/fields/` and the layouts [`zoho-studio z-crm:layouts:pull`](layouts.md) writes into `<module>/layouts/` stay where they are. A metadata file whose content did not change stays as it is, and a changed one is rewritten.

A module removed in Zoho moves to `data/.removed/<date-time>/` with its whole folder — metadata, fields, and layouts — see [Pulling](../../guides/pulling.md). Run `z-crm:modules:pull` first, `z-crm:fields:pull` and `z-crm:layouts:pull` after: they walk the modules in the local folder.

The location is fixed: `data/zoho-crm/modules/` under the project root, created if it is not there. No
setting moves it — see [`zoho-studio init`](../project/init.md) for the project tree.

## Failures

The whole command is a single request, so failing to fetch the module list is fatal — there would be
nothing to write, and the existing folder is left untouched because nothing is moved until the list
arrives.

## Logs

The CLI writes structured JSON logs to [`logs.file`](../project/settings.md), `logs/zoho-studio-cli.log` by
default, created on the first line written. `z-crm:modules:pull` records the start of the run, how many
modules were found, and the final count. Tokens and authorization headers are never logged.
