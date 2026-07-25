# Rule: Project architecture and code style

Keep the project structure simple and flat while the codebase is small.

Do not introduce new architectural layers, generic abstractions, or shared folders without a concrete current need. Prefer straightforward code that is easy to understand, test, and change.

## Structure

```text
src/
  commands/   # CLI command definitions
  entities/   # domain entities (e.g.: function, workflow, module)
  shared/     # reusable infrastructure and utilities
  api/
    auth/     # authentication, OAuth, tokens, and authenticated client setup.
    crm/      # Zoho CRM API clients, requests, and related types.
```

Inside `api/`, each area (`auth/`, `crm/`) keeps its requests in a `requests/` folder, one request
per file, and its own types next to them. Types shared across areas live in the root of `api/`.

```text
api/
  auth/
    requests/
      exchange-grant-code.api.ts
    auth.types.ts
    index.ts
```

## Code style

### File naming

Follow NestJS-style naming conventions for files: `<name>.<responsibility>.ts`
Use lowercase kebab-case for names.

Examples:

```text
crm.client.ts
functions.api.ts
config.loader.ts
config.types.ts
pull-functions.command.ts
token.store.ts
```

Use clear responsibility suffixes where applicable:

* `.command.ts`
* `.api.ts`
* `.client.ts`
* `.service.ts`
* `.store.ts`
* `.loader.ts`
* `.factory.ts`
* `.types.ts`
* `.config.ts`
* `.constants.ts`
* `.utils.ts`

### Exports

Use `index.ts` to expose a clear public interface for a folder when it improves imports.

```ts
import { loadConfig } from '@/config';
import { fetchFunctionsRequest } from '@/api/crm';
```

Direct relative imports inside the same module are acceptable.

Do not create barrel exports only for ceremony.


## Tests

Tests live in `tests/`, mirroring the `src/` structure, and use the `.spec.ts` suffix.

```text
src/config/config.loader.ts   ->  tests/config/config.loader.spec.ts
src/commands/init/init.command.ts  ->  tests/commands/init.command.spec.ts
```

Use the built-in Bun test runner (`import { describe, expect, test } from 'bun:test'`).
The `@/` alias resolves from `tests/` as well, so import production code through it.

Run `bun run check` (lint + typecheck + tests) before handing off a change.

## CLI command and option style

- Binary name: `zoho-studio`.
- Use `namespace:action` for grouped commands (`function:pull`, `workflow:pull`, `records:view`).
- Simple top-level commands stay bare (`install`).
- Use explicit named options; prefer full names for clarity (`--module`, `--foo`).
- Short aliases may be added for frequently used options (`-t`, `-p`, `-f`).
- Avoid hidden positional arguments when a named option would make the command clearer.

```bash
zoho-studio init example-project-name
zoho-studio functions:pull --foo=bar
zoho-studio functions:pull --f=bar
```
