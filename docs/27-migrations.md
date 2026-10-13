# Migrations

A migration is a TypeScript file in `migrations/zoho-crm/` that describes a new Zoho CRM module with
its fields, or fields to add to a module that already exists. `bun run migrate` in the project
checks it against the organization the project is logged in to and, once you confirm, creates
what it describes.

**A migration only creates.** It never changes or deletes a field, and nothing it created can be
undone through it: Zoho has no API that deletes a module. Try a migration on a sandbox first.

```bash
bun run migrate                         # pick a migration from the list
bun run migrate 001-projects --dry-run  # show the plan and the conflicts, change nothing
bun run migrate 001-projects --yes      # run without the confirmation prompt
```

The script comes with a project made by [`zoho-studio init`](3-init-command.md) and needs the
packages linked (`bun install` after `bun run link`, see [init](3-init-command.md#scripts)) and a
[login](4-login-command.md).

## A migration file

The file name without `.ts` is the migration's name, and the list shows migrations in name order,
so a numeric prefix keeps them in the order they were written. A file declares exactly one action.

```ts
import { defineMigration } from '@zoho-studio/zoho-crm/migrations'

export default defineMigration({
    create: {
        api_name: 'Projects',
        singular_label: 'Project',
        plural_label: 'Projects',
        profiles: ['Administrator', 'Standard'],
        fields: (schema) => {
            schema.text('Code', { api_name: 'Code', length: 50 })
            schema.currency('Budget', { decimal_place: 2 })
            schema.picklist('Stage', { values: ['New', 'Active', 'Done'] })
            schema.lookup('Account', { module: 'Accounts' })
        },
    },
})
```

`create` makes a new module. `api_name` is optional — Zoho then derives it from `plural_label` — and
`profiles` names the profiles that get the module, `Administrator` alone when left out. Profile
names are the ones [`z-crm:profiles:pull`](26-profiles-pull-command.md) saves.

`update` adds fields to an existing module:

```ts
export default defineMigration({
    update: {
        module: 'Projects',
        fields: (schema) => {
            schema.boolean('Archived')
        },
    },
})
```

A new project has an example to copy in `scripts/example-migration.ts.txt`.

## Field types

Every method takes the field label (up to 25 characters) and options. Two options are accepted by
all of them:

- `api_name` — Zoho derives one from the label when it is left out;
- `tooltip` — a hint for whoever fills the field in. A text alone, up to 255 characters, shows as
  an info icon next to the field, and `{ type: 'info_icon', text }` is the same.
  `{ type: 'static_text', text }`, up to 35 characters, shows the hint inside the empty field
  instead; Zoho accepts it only on fields you type into — text, email, phone, website, integer,
  bigint, double, percent, currency, and lookup.

The other options keep Zoho's names, and an option you leave out gets Zoho's default.

| Method | Options |
|---|---|
| `text`, `phone` | `length` |
| `textarea` | `size`: `small` (the default), `large`, or `rich_text` |
| `email`, `website`, `date`, `datetime`, `boolean`, `userlookup` | — |
| `integer`, `bigint` | `length` |
| `double` | `length`, `decimal_place` |
| `percent` | `decimal_place` |
| `currency` | `length`, `decimal_place`, `rounding_option`, `precision` |
| `picklist`, `multiselectpicklist` | `values`: strings, or `{ display_value, actual_value }` pairs |
| `lookup` | `module` (required), `display_label` — the related list label, the field label by default |

## What is checked before a run

Any of these blocks the run, and the script prints each one:

- the file does not load, or breaks a rule Zoho would reject: label lengths, API name format, a
  label or API name declared twice, an empty or repeated picklist value, a tooltip that is too long or
  of a type the field does not support;
- for `create`, a module with the same API name or label exists, or a field collides with the
  fields Zoho adds to every new module (`Name`, `Owner`, `Email`, `Secondary_Email`, `Tag`, …);
- for `update`, the module does not exist, or a field with the same label or API name is already
  in it — names are compared regardless of case;
- a lookup points at a module that does not exist, including the module the same migration
  creates;
- a profile name is unknown;
- the migration was already applied to this organization (see the journal below).

## The run

Before the plan, the script names the organization the migration goes to, with its type in
capitals — green for a sandbox, red for anything else:

```text
Organization: Acme (7000000012345) — SANDBOX
```

The confirmation question names it too, and calls anything but a sandbox `PRODUCTION`. With
`--yes` there is no question, but the line is still printed.

The module is created first, then the fields, up to 25 per request. The run stops at the first
step Zoho rejects; for fields it prints which ones failed and why. After the run — a failed one
too, once the module exists — the module is read back from Zoho, the script reports which planned
fields exist and which are missing, and the module's folder in `src/zoho-crm/modules/` is
refreshed — if that read fails, the script says so and the run is still journaled — as [`z-crm:modules:pull`](7-modules-pull-command.md) and
[`z-crm:fields:pull`](8-fields-pull-command.md) would write it.

The exit code is 0 when the migration was applied, a dry run found no conflict, or you declined
the prompt, and 1 otherwise.

## The journal

Every run is recorded in `.zoho-studio/migrations.json`, separately for each organization, so a
project that points at a sandbox and then at production keeps both histories. An applied migration
cannot be run again on the same organization; the list shows it as applied. A failed one is marked
as failed and can be run again, but whatever it created already now counts as a conflict — finish
the work with a new `update` migration.

The journal lives on your machine: `init` keeps it out of git, and a teammate's runs are not in it.
A project created before migrations existed needs `migrations.json` added to
`.zoho-studio/.gitignore` by hand.

## Scopes

Creating needs `ZohoCRM.settings.modules.CREATE` and `ZohoCRM.settings.fields.CREATE`, and the
checks read modules, fields, and profiles. All of them are in the default
[settings](2-settings.md), and `ZohoCRM.settings.ALL` covers them as well.

## Output for other programs

`--json` prints one JSON object per line instead of the readable report: first
`{ "type": "prepared", "migration": …, "organization": { "id", "company_name", "type" } }` with
the plan, the conflicts, and the target organization, then one event per
step, per field result, for the verification, and a final `finished` with `applied`, `failed`, or
`blocked`. A migration with conflicts ends right after `prepared` with a `blocked` `finished`; a
dry run without conflicts ends at `prepared`. It never prompts, so it needs a migration name and
`--yes` or `--dry-run`.
