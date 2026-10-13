# Migrations

A migration creates a module with its fields in your CRM, or adds fields to a module that already
exists. You describe it in a file, Zoho Studio checks it against the CRM and shows what it will do,
and only after you confirm does it send anything.

**A migration only creates, and cannot be undone through Zoho Studio.** It never changes or
deletes a field, and Zoho offers no way to delete a module through its API. Try a migration on a
sandbox organization first.

The project needs its packages installed for migrations — see [The project](4-project.md#scripts-and-migrations).

## 1. Write a migration

Create a file in `migrations/zoho-crm/`. Its name is the migration's name, and a number in front
keeps them in order, for example `001-create-projects.ts`. A project has an example to copy in
`scripts/example-migration.ts.txt`.

```ts
import { defineMigration } from '@zoho-studio/zoho-crm/migrations'

export default defineMigration({
    create: {
        api_name: 'Projects',
        singular_label: 'Project',
        plural_label: 'Projects',
        fields: (schema) => {
            schema.text('Code', { length: 50 })
            schema.currency('Budget', { decimal_place: 2 })
            schema.date('Deadline')
            schema.picklist('Stage', { values: ['New', 'Active', 'Done'] })
            schema.lookup('Account', { module: 'Accounts' })
        },
    },
})
```

To add fields to an existing module, use `update` instead of `create`:

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

Field types: text, textarea, email, phone, website, integer, bigint, double, percent, currency,
date, datetime, boolean, picklist, multiselectpicklist, lookup, userlookup. The options of each are
in the [migrations reference](../technical/27-migrations.md#field-types).

Any field can carry a hint for whoever fills it in: `schema.text('Code', { tooltip: 'Internal project code' })`
shows an info icon with that text next to the field.

## 2. Check it

```bash
bun run migrate 001-create-projects --dry-run
```

This shows the plan — the module, then the fields in batches — and any **conflicts**: a module or
field name that is already taken, a lookup to a module that does not exist, an unknown profile, a
mistake in the file. A migration with a conflict does not run. Fix the file and check again.

## 3. Run it

```bash
bun run migrate
```

Pick the migration from the list, read the plan, and confirm. **Check the first line**: it names
the organization the migration goes to and says `SANDBOX` in green or `PRODUCTION` in red. The terminal shows each step and
each field as it is created. At the end, Zoho Studio reads the module back from the CRM, reports
which fields exist, and refreshes the module's files in `src/zoho-crm/modules/`.

## Afterwards

Each run is remembered for the organization in `.zoho-studio/migrations.json`. An applied
migration is shown as applied and cannot run again on the same organization. A failed one can be
run again, but whatever it already created then counts as a conflict — finish the work with a new
`update` migration.

This history stays on your computer: a teammate's runs are not in it.

More: [migrations reference](../technical/27-migrations.md).
