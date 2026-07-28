# `zoho-studio fields:pull`

Downloads the fields of every locally stored module into a `fields/` subfolder of that module — one
JSON file per field.

```bash
zoho-studio fields:pull
```

```text
Pulling fields |████████████████████| 42/42 | Vendors
Modules processed: 42
Fields saved: 913
Modules failed: 1
  - Ghost_Module: Request failed with status code 400
```

**Run [`zoho-studio modules:pull`](7-modules-pull-command.md) first, and re-run this command after
every `modules:pull`.** The list of modules to walk comes from the local modules folder, not from
the API, and `modules:pull` deletes and recreates that folder — which throws away the fields pulled
earlier. The correct order is always `modules:pull` → `fields:pull`.

The command also needs a project that has been through [`zoho-studio login`](4-login-command.md),
with the `ZohoCRM.settings.fields.READ` scope granted.

## What lands on disk

```text
modules/
└── Leads/
    ├── Leads.metadata.json
    └── fields/
        ├── Last_Name.json
        ├── Email.json
        └── Custom_Field_1.json
```

Each file is named after the field's API name and holds the full field record exactly as
`GET /settings/fields` returned it, formatted with a four-space indent and a trailing newline. Only
characters a path segment cannot contain are replaced; nothing else about the name is changed.

The `fields/` folder is fixed — it is not configurable. Its parent is
[`crm.modules.root_dir`](2-settings.md), the same folder `modules:pull` writes to.

**The `fields/` folder of every pulled module is deleted and recreated on each run**, so a field
removed in Zoho disappears locally and any local edit inside it is lost. Nothing else is touched:
the module's metadata file stays where it is, and a module that is not part of the run keeps its
fields.

## One module at a time

`--module` narrows the run to a single module, which is the fast way to refresh one module without
walking the whole organization:

```bash
zoho-studio fields:pull --module=Leads
```

The value is a module API name — the name of its local directory. A value that is not a plain
directory name, or a module that has no local directory, stops the command before anything is
deleted.

## Failures

A module whose fields cannot be fetched — no subscription, no longer in Zoho, a stray directory
that is not a module — does not stop the run. Its existing `fields/` folder is left untouched, the
module is listed in the summary with a short error, and the remaining modules are still pulled. The
command still succeeds.

Running with an empty or missing modules folder is fatal: there is nothing to walk, and the error
points at `modules:pull`.

Modules are requested one at a time with a short delay between them to stay clear of Zoho's API
limits, so an organization with many modules takes a while. The progress bar shows the module
currently being pulled.

## Logs

The CLI writes structured JSON logs to [`logs.file`](2-settings.md), `.zoho-studio/cli.log` by
default. `fields:pull` records the start of the run, how many local modules were found, the final
counts, and every failure with its stack trace. Individual successful modules are not logged — the
progress bar already shows them.
