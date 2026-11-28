# z-crm:migrations:make

Creates a migration file `migrations/zoho-crm/<date-time>_<action>_<module>.ts` through questions:
create a module (plural and singular label) or add fields to an existing one (picked from the
pulled modules). The fields are left for you to declare.

- **Writes to Zoho:** no. **Writes locally:** one file in `migrations/zoho-crm/`. **Needs login:** no.
- **Needs a terminal:** yes — without one it stops. An agent can write the file by hand instead:
  `export default defineMigration({ create: { … } })` from `@zoho-studio/zoho-crm/migrations`.

## Next

Declare the fields, then `bun run migrate <name> --dry-run`. An `update` migration with no fields
is reported as a conflict.
