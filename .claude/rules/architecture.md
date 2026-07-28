# Rule: Project architecture and code style

Keep the project structure simple and flat while the codebase is small.

Do not introduce new architectural layers, generic abstractions, or shared folders without a concrete current need.

## Structure

```text
src/
  index.ts      # CLI entry point, registers the commands
  config.ts     # names and path resolvers for the .zoho-studio/ project directory
  commands/     # CLI command definitions, one folder per command
  settings/     # project settings: types, defaults, loading, and storage
  entities/     # domain entities (e.g.: field, function, module)
    <entity>/
      <entity>.types.ts   # the shape the CLI depends on
      api/                # requests belonging to this entity, one per file
  shared/       # reusable infrastructure and utilities
    logger/     # pino logger, createCommandLogger per command
    utils/      # standalone helpers, exposed through index.ts
    api/        # shared API infrastructure only — no entity endpoints
      auth/     # authentication, OAuth, tokens, and authenticated client setup
      crm/      # Zoho CRM client and organization-level requests
```

`shared/api/` holds only infrastructure that belongs to no single entity: base clients, HTTP
configuration, authentication, and error handling. An endpoint that belongs to a domain entity
lives in `entities/<entity>/api/` instead.

The two folders differ in one more way. Inside `shared/api/`, each area keeps its requests in a
`requests/` subfolder; inside `entities/<entity>/`, requests sit directly in `api/`.

```text
shared/api/                          entities/field/
  auth/                                field.types.ts
    requests/                          api/
      refresh-access-token.request.ts     get-fields-list.request.ts
      index.ts                            index.ts
    auth.client.ts                     index.ts
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
settings.loader.ts
settings.store.ts
pull-functions.command.ts
path.utils.ts
```

Responsibility suffixes in use: `.command.ts`, `.request.ts`, `.client.ts`, `.service.ts`,
`.store.ts`, `.loader.ts`, `.types.ts`, `.settings.ts`, `.error.ts`, `.utils.ts`, `.spec.ts`.

Add a new suffix only when an existing one does not fit the responsibility.

### Exports

Use `index.ts` to expose a clear public interface for a folder when it improves imports.

```ts
import { getFunctionsList } from '@/entities/function'
import { crmClient } from '@/shared/api/crm'
import { getProjectSettings } from '@/settings/settings.store'
```

An entity is imported from its root, never from its `api/` folder directly.

Direct relative imports inside the same module are acceptable.

Do not create barrel exports only for ceremony.

### Self-documenting code

Prefer code that explains itself before comments are needed.

The default is no comment. Wanting to write one is usually a signal that a name or the structure
is wrong: rename, introduce an explanatory variable, or extract a function first, and write the
comment only when that does not remove the need for it.

- Prefer intention-revealing names over short or generic ones; a slightly longer name is fine when it aids understanding. Avoid abbreviations unless established in the project domain.
- Comments explain **why**, not **what** — non-obvious intent, constraints, trade-offs, external behavior, or a decision that would otherwise look strange.
- Preserve existing comments unless they are incorrect or obsolete.

Do not write comments that restate the code, narrate a function body step by step, or split a file
into labelled section headers.

```ts
// good — explains external behavior that is not visible here
// Zoho reports OAuth failures as HTTP 200 with an `error` field in the body.
if (isAuthErrorPayload(response.data)) {
    throw new AuthError(response.data.error)
}

// avoid — restates the code
// Get the task id from options
const taskId = options.task
```

## Tests

Tests live in `tests/` and use the `.spec.ts` suffix. The path mirrors `src/`, except that a
command's folder is flattened away — command specs sit directly under `tests/commands/`.

```text
src/settings/settings.loader.ts             ->  tests/settings/settings.loader.spec.ts
src/shared/api/auth/token.service.ts        ->  tests/shared/api/auth/token.service.spec.ts
src/commands/init/init.service.ts           ->  tests/commands/init.service.spec.ts
```

Use the built-in Bun test runner (`import { describe, expect, test } from 'bun:test'`).
The `@/` alias resolves from `tests/` as well, so import production code through it.

Tests that need a project on disk use the shared fixture in `tests/support/temp-project.ts`
rather than rolling their own temp directory. Requests are tested against a real `Bun.serve`
stub, not a mocked axios.

Run `bun run check` (lint + typecheck + tests) before handing off a change.

## CLI command and option style

- Binary name: `zoho-studio` (`program.name()`; the build produces `dist/zoho-studio`).
- Use `namespace:action` for grouped commands, with the namespace in the plural: `functions:pull`, `modules:pull`, `fields:pull`.
- Simple top-level commands stay bare: `init`, `login`, `status`.
- Use explicit named options with full names: `--module <api_name>`, `--force`, `--json`.
- A short alias must be declared in the option spec and used with a single dash (`-m`). Commander does not abbreviate long options — `--m=Leads` fails at runtime.
- Prefer a named option over a positional argument, unless the argument is the command's whole subject (`init [name]`).

```bash
zoho-studio init example-project-name
zoho-studio status --json
zoho-studio fields:pull --module=Leads
```
