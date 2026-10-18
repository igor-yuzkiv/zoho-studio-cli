# `zoho-studio z-crm:layouts:pull`

Downloads the layouts of every locally stored module into a `layouts/` subfolder of that module —
one JSON file per layout, with its sections and the fields in each section. This is where formula
fields carry their expression: `z-crm:fields:pull` gets a formula's return type but not the formula
itself, because Zoho returns the expression only as part of a layout.

```bash
zoho-studio z-crm:layouts:pull
```

```text
Pulling layouts |████████████████████| 42/42 | Vendors
Modules processed: 42
Layouts saved: 47
Modules failed: 1
  - Ghost_Module: Request failed with status code 400
```

**Run [`zoho-studio z-crm:modules:pull`](7-modules-pull-command.md) first, and re-run this command after
every `z-crm:modules:pull`.** The list of modules to walk comes from the local modules folder, and
`z-crm:modules:pull` deletes and recreates that folder — layouts included.

The command also needs a project that has been through [`zoho-studio login`](4-login-command.md),
with the `ZohoCRM.settings.layouts.READ` scope (or `ZohoCRM.settings.ALL`) granted.

## What lands on disk

```text
data/zoho-crm/modules/
└── Deals/
    ├── Deals.metadata.json
    ├── fields/
    └── layouts/
        ├── Standard__s.json
        └── Partner_Deals.json
```

Each file is named after the layout's API name and holds the layout exactly as
`GET /settings/layouts` returned it, formatted with a four-space indent and a trailing newline. Two
layouts with the same API name get the second one's id added to its file name.

The layouts are requested with `mode=all`, so `sections` holds the quick create and business card
sections next to the ones the record page shows. A formula field inside a section looks like this:

```json
{
    "api_name": "Total",
    "data_type": "formula",
    "formula": {
        "return_type": "double",
        "expression": "${Quantity}*2",
        "evaluation_order": 1,
        "dynamic": false,
        "stop_compute_conditionally": false,
        "assume_default": true,
        "stop_compute_expression": null
    }
}
```

**The `layouts/` folder of every pulled module is deleted and recreated on each run**, so a layout
removed in Zoho disappears locally and any local edit inside it is lost. The module's metadata and
its `fields/` folder are not touched, and a module that is not part of the run keeps its layouts.

## One module at a time

```bash
zoho-studio z-crm:layouts:pull --module=Deals
```

The value is a module API name — the name of its local directory. A value that is not a plain
directory name, or a module that has no local directory, stops the command before anything is
deleted.

## Failures

A module whose layouts cannot be fetched does not stop the run. Its existing `layouts/` folder is
left untouched, the module is listed in the summary with a short error, and the remaining modules
are still pulled. Running with an empty or missing modules folder is fatal, and the error points at
`z-crm:modules:pull`.

Modules are requested one at a time with a short delay between them to stay clear of Zoho's API
limits.

## Logs

`z-crm:layouts:pull` writes to [`logs.file`](2-settings.md) the start of the run, how many local
modules were found, the final counts, and every failure with its stack trace.
