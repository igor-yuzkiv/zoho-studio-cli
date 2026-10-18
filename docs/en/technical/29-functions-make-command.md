# `zoho-studio z-crm:functions:make`

Scaffolds a new Deluge function in `src/zoho-crm/functions/` by asking a few questions, so you start
from files Zoho will accept rather than from a blank page, or imports a function already pulled into
`data/`. It works offline: no login, no request to
Zoho.

```bash
zoho-studio z-crm:functions:make
```

```text
✔ Category Automation
✔ Return type void
✔ Module Programs
✔ What the function does refresh pricing
✔ API name oz_wf_programs_refresh_pricing
✔ Display name oz_wf_programs_refresh_pricing
✔ Description Recalculates the program prices

Files to create:
  src/zoho-crm/functions/oz_wf_programs_refresh_pricing/oz_wf_programs_refresh_pricing.deluge
  src/zoho-crm/functions/oz_wf_programs_refresh_pricing/oz_wf_programs_refresh_pricing.deploy.json
✔ Create the function? Yes
Created src/zoho-crm/functions/oz_wf_programs_refresh_pricing/oz_wf_programs_refresh_pricing.deluge
Created src/zoho-crm/functions/oz_wf_programs_refresh_pricing/oz_wf_programs_refresh_pricing.deploy.json
```

The command needs an interactive terminal; without one it stops with an error and creates nothing.

## The questions

- **Category** — one of the seven Deluge categories: Button, Automation, Schedule, Related List,
  Standalone, Signals, Validation Rule.
- **Return type** — asked only for Automation (`void` or `string`). Every other category allows a
  single type, which is used as it is: `string` for Button, Related List and Standalone, `void` for
  Schedule and Signals, `map` for Validation Rule.
- **Module** and **What the function does** — the parts of the proposed API name, asked only when
  naming is enabled. The module is picked from the modules pulled into `data/zoho-crm/modules/`,
  typed in by hand, or left out. Both are turned into lower snake case.
- **API name** — proposed from [`zohoCrm.functions.naming`](2-settings.md) as
  `<vendor>_<category prefix>_<module>_<purpose>`, and editable. With naming disabled you type it.
- **Display name** — the API name unless you change it.
- **Description** — optional.

The answers are checked against Zoho's rules as you type: the display name has 3–100 characters,
starts with a letter, and holds letters, digits, spaces, `-` and `_`; the API name follows the same
rule without spaces; the description is at most 3000 characters. An API name whose folder already
exists in `src/zoho-crm/functions/` is refused.

Before writing, the command lists the files it will create and asks for confirmation; declining
creates nothing.

## What lands on disk

```text
src/zoho-crm/functions/
└── oz_wf_programs_refresh_pricing/
    ├── oz_wf_programs_refresh_pricing.deluge
    └── oz_wf_programs_refresh_pricing.deploy.json
```

Both the folder and the files are named after the API name, which Zoho never lets you change.

`*.deluge` holds a stub that compiles as it is. Zoho requires the declaration to be the category and
the display name, both in lower case with spaces and `-` replaced by `_`, so the stub writes it for
you; the body returns an empty value of the declared type:

```text
void automation.oz_wf_programs_refresh_pricing()
{
}
```

Arguments are not asked for — add them to the declaration yourself.

`*.deploy.json` holds what Zoho needs besides the code:

```json
{
    "id": null,
    "name": "oz_wf_programs_refresh_pricing",
    "api_name": "oz_wf_programs_refresh_pricing",
    "description": "Recalculates the program prices",
    "runtime": "Deluge 1.0",
    "category": "Automation",
    "deployments": []
}
```

`id` stays `null` until the function exists in Zoho. The return type and the arguments are not
repeated here: Zoho reads them from the declaration.

## Importing a pulled function

When the API name you enter belongs to a function already pulled into `data/zoho-crm/functions/`,
the command offers to import it into `src/` instead of creating a new one. Declining creates nothing.

Importing copies the snapshot's code unchanged into `<api_name>.deluge` and writes
`<api_name>.deploy.json` from the snapshot's metadata — including its CRM `id`, so a deploy updates
that function rather than creating another. The snapshot in `data/` is left as it is. The category
comes from the snapshot, whatever you picked at the first question.

Only a function that runs on `Deluge 1.0` and has one of the seven Deluge categories can be imported;
any other is refused with the reason. If the code does not declare `<category>.<display name>` the way
Zoho expects, the import still happens and the command warns that a deploy will be rejected until the
declaration is fixed.

## A project that still keeps snapshots in `src/`

Pulled snapshots used to live in `src/zoho-crm/`. If `src/zoho-crm/functions/` holds a folder with
files but no `*.deploy.json`, the command stops before asking anything and tells you to move the
snapshots with `mv src/zoho-crm data/zoho-crm`.
