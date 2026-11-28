# z-crm:migrations — creating modules and fields

A migration is a TypeScript file in `migrations/zoho-crm/` that declares one action: `create` a
module with its fields, or `update` — add fields to a module that exists. `bun run migrate` (a
script in the project, not a CLI command) checks it against the logged-in organization and, after
confirmation, creates it.

**A migration only creates, and nothing it creates can be undone through the API**: Zoho has no
endpoint that deletes a module, and a migration never changes or deletes fields. Run it on a
sandbox first, and run it on production only when the person asks.

## Writing a migration

The file name without `.ts` is the migration's name; migrations are listed in name order. Name a
new one `<YYYY_MM_DD>_<HHMMSS>_<create|update>_<module_in_snake_case>.ts` — what
`z-crm:migrations:make` produces — or write it by hand in the same shape.

```ts
import { defineMigration } from '@zoho-studio/zoho-crm/migrations'

export default defineMigration({
    create: {
        api_name: 'Projects',              // optional: Zoho derives it from plural_label
        singular_label: 'Project',         // 1–50 characters
        plural_label: 'Projects',          // 1–50 characters
        profiles: ['Administrator', 'Standard'], // optional: Administrator alone by default
        fields: (schema) => {
            schema.text('Code', { api_name: 'Code', length: 50 })
            schema.textarea('Notes', { size: 'large' })
            schema.currency('Budget', { decimal_place: 2 })
            schema.date('Deadline')
            schema.picklist('Stage', { values: ['New', 'Active', 'Done'] })
            schema.lookup('Account', { module: 'Accounts' })
        },
    },
})
```

```ts
export default defineMigration({
    update: {
        module: 'Projects',                // API name of an existing module
        fields: (schema) => {
            schema.boolean('Archived')
        },
    },
})
```

One file — one action. Profile names come from `data/zoho-crm/profiles/` (`z-crm:profiles:pull`);
existing modules and fields from `data/zoho-crm/modules/` — read them before writing an `update`.

## Field types

Every method takes the label (1–25 characters) and options. Two options work on every type:

- `api_name` — Zoho derives it from the label when left out. Letters, digits, single underscores,
  starting with a letter.
- `tooltip` — a text up to 255 characters (an info icon), the same as `{ type: 'info_icon', text }`;
  or `{ type: 'static_text', text }` up to 35 characters, shown inside the empty field — accepted
  only on text, email, phone, website, integer, bigint, double, percent, currency and lookup.

| Method | Options |
|---|---|
| `text`, `phone` | `length` (1–50000) |
| `textarea` | `size`: `small` (default), `large`, `rich_text` |
| `email`, `website`, `date`, `datetime`, `boolean`, `userlookup` | — |
| `integer`, `bigint` | `length` |
| `double` | `length`, `decimal_place` (0–9) |
| `percent` | `decimal_place` |
| `currency` | `length`, `decimal_place`, `rounding_option` (`normal`, `round_off`, `round_up`, `round_down`), `precision` (0–9) |
| `picklist`, `multiselectpicklist` | `values` (required, at least one): strings, or `{ display_value, actual_value }` |
| `lookup` | `module` (required, must already exist), `display_label` (the related list label) |

An option left out gets Zoho's default. An option the type does not have, or a value of the wrong
kind (`length: '50'`, a misspelt `decimal_places`), blocks the run.

What Zoho does on its own: a picklist gets `-None-` as its first value; a new module comes with
system fields, so a `create` must not declare any of them (by API name or label): `Name`
(`<Singular> Name`), `Owner` (`<Singular> Owner`), `Record_Image`, `Email`, `Secondary_Email`,
`Email_Opt_Out`, `Created_By`, `Modified_By`, `Created_Time`, `Modified_Time`,
`Last_Activity_Time`, `Tag`, `Currency`, `Exchange_Rate`, `Locked__s`, `Record_Status__s`,
`Unsubscribed_Mode`, `Unsubscribed_Time`, `id`.

## What a migration cannot do

- Change or delete any module or field.
- Other field types — formula, auto-number, file upload, subform, …: there is no method.
- Required, unique, default value, or any setting outside the table.
- A lookup to a module created in the same migration: create the module in an earlier one.

Say so to the person; those changes are made in the Zoho UI.

## Running

```bash
bun run migrate <name> --dry-run   # the plan and the conflicts; changes nothing — always first
bun run migrate <name>             # asks, naming the organization: SANDBOX, or PRODUCTION for anything else
bun run migrate <name> --yes       # no question — only with the person's agreement for this run
bun run migrate <name> --json --dry-run   # one JSON event per line, for programs
```

Checked before anything is created, each one blocks the run: the file loads and its options are
valid; for `create`, no module with that API name or label exists and no field collides with the
system fields; for `update`, the module exists and has no field with the same label or API name
(case-insensitive); lookups point at existing modules; profiles exist; the migration was not
already applied to this organization.

The run creates the module, then the fields in batches of up to 25, and stops at the first step Zoho
rejects. Afterwards it reads the module back, reports which planned fields exist, and refreshes the
module's folder in `data/zoho-crm/modules/`. Exit code `0` — applied, a clean dry run, or the
prompt declined; `1` otherwise.

## The journal

`.zoho-studio/migrations.json` records every run per organization (out of git, local to the
machine). An applied migration cannot run again on the same organization. A failed one can be
rerun, but whatever it already created now counts as a conflict — finish it with a new `update`
migration instead.

The script needs the packages linked once: `bun run link` in the zoho-studio repository, then
`bun install` in the project. Scopes: `ZohoCRM.settings.modules.CREATE` and
`ZohoCRM.settings.fields.CREATE` (in the defaults).
