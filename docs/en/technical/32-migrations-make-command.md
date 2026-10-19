# `zoho-studio z-crm:migrations:make`

Creates a migration file in `migrations/zoho-crm/` by asking a few questions, so you start from a
file with the action and the module already filled in and only declare the fields. It works
offline: no login, no request to Zoho.

```bash
zoho-studio z-crm:migrations:make
```

```text
✔ Migration type Create a module
✔ Module name (plural label) Customer Orders
✔ Singular label Customer Order

Migration to create:
  Name:   2026_10_19_202401_create_customer_orders
  File:   migrations/zoho-crm/2026_10_19_202401_create_customer_orders.ts
  Action: create the module "Customer Orders" (singular "Customer Order")
✔ Create the migration? Yes
Created migrations/zoho-crm/2026_10_19_202401_create_customer_orders.ts
Declare the fields, then check it with "bun run migrate 2026_10_19_202401_create_customer_orders --dry-run".
```

The command needs an interactive terminal; without one it stops with an error and creates nothing.

## The questions

- **Migration type** — `Create a module` or `Add fields to an existing module`, the `create` and
  `update` actions of a [migration](27-migrations.md#a-migration-file).
- For a new module: **Module name (plural label)** and **Singular label**. The singular label is
  proposed from the plural one (`Projects` → `Project`, `Companies` → `Company`) and editable. Each
  label has 1–50 characters.
- For an existing module: **Module** — a search over the modules pulled into
  `data/zoho-crm/modules/`. A module that is not pulled can be typed in by its API name and picked
  as `<name> (not pulled)`. With nothing pulled, the command asks for the API name directly. An API
  name starts with a letter and holds letters, digits, and single underscores, not ending with one.

Before writing, the command shows the migration's name, its file, and what it will do, and asks for
confirmation; declining creates nothing.

## The file

The name follows Laravel's convention: the local date and time the file was made, the action, and
the module in snake case — `2026_10_19_202401_create_customer_orders`. The prefix always has the
same width, so the list of migrations, sorted by name, is in the order they were made, and two
people creating migrations in separate branches do not end up with the same name.

Migrations named by hand with a number keep their place when the number is zero-padded: `001-…`
sorts before every dated name. A name such as `9-…` sorts after them.

```ts
import { defineMigration } from '@zoho-studio/zoho-crm/migrations'

export default defineMigration({
    create: {
        singular_label: 'Customer Order',
        plural_label: 'Customer Orders',
        fields: (schema) => {
            // schema.text('Code', { length: 50 })
        },
    },
})
```

An `update` migration names the module instead of the labels: `module: 'Deals'`. The new module's
`api_name` is left out, so Zoho derives it from the plural label; add it to the file to choose it
yourself.

The fields are yours to declare — see [field types](27-migrations.md#field-types). Until an
`update` migration declares at least one field, `bun run migrate` reports it as a conflict.
