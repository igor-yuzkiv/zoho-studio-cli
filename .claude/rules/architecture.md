# Rule: Project architecture and code style

Keep the project structure simple and flat while the codebase is small.

Do not introduce new architectural layers, generic abstractions, or shared folders without a concrete current need. Prefer straightforward code that is easy to understand, test, and change.

## Structure

```text
src/
  index.ts      # CLI entry point, registers the commands
  config.ts     # file names and paths the CLI relies on
  commands/     # CLI command definitions
  settings/     # project settings: loading, defaults, and storage
  entities/     # domain entities (e.g.: function, workflow, module)
    <entity>/
      api/      # requests belonging to this entity
  shared/       # reusable infrastructure and utilities
    utils/      # standalone helpers, exposed through index.ts
    api/        # shared API infrastructure only — no entity endpoints
      auth/     # authentication, OAuth, tokens, and authenticated client setup.
      crm/      # Zoho CRM API clients, requests, and related types.
```

`shared/api/` holds only infrastructure that belongs to no single entity: base clients, HTTP
configuration, authentication, error handling, and shared types. An endpoint that belongs to a
domain entity lives in `entities/<entity>/api/` instead.

Inside `shared/api/`, each area (`auth/`, `crm/`) keeps its requests in a `requests/` folder, one
request per file, and its own types next to them. Types shared across areas live in the root of
`shared/api/`.

```text
shared/api/
  auth/
    requests/
      refresh-access-token.request.ts
      index.ts
    auth.client.ts
    auth.error.ts
    auth.types.ts
    index.ts
```

Each area owns one axios instance, created and exported at module level (`auth.client.ts`,
`crm.client.ts`). Per-project configuration — base URL, authorization header — is resolved inside
its interceptors, so requests stay free of setup and callers never build a client.

## Code style

### File naming

Follow NestJS-style naming conventions for files: `<name>.<responsibility>.ts`
Use lowercase kebab-case for names.

Examples:

```text
crm.client.ts
get-organization.request.ts
config.loader.ts
config.types.ts
pull-functions.command.ts
token.store.ts
```

Use clear responsibility suffixes where applicable:

* `.command.ts`
* `.request.ts`
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
import { fetchFunctionsRequest } from '@/shared/api/crm';
```

Direct relative imports inside the same module are acceptable.

Do not create barrel exports only for ceremony.


## Tests

Tests live in `tests/`, mirroring the `src/` structure, and use the `.spec.ts` suffix.

```text
src/settings/settings.loader.ts             ->  tests/settings/settings.loader.spec.ts
src/commands/init/init.service.ts           ->  tests/commands/init.service.spec.ts
src/shared/api/auth/token.service.ts        ->  tests/shared/api/auth/token.service.spec.ts
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
