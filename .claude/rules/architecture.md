# Rule: Project architecture and code style

Keep the project structure simple and flat while the codebase is small.

Do not introduce new architectural layers, generic abstractions, or shared folders without a concrete current need.

## Structure

The repository is a Bun workspaces monorepo. The core lives in packages that the CLI, the web app
and, later, user scripts import by name; the apps hold only what is specific to them.

```text
packages/
  core/           # @zoho-studio/core — depends on nothing else in the repo
    src/
      config.ts     # names and path resolvers shared by every area: .zoho-studio/, src/, logs/
      settings/     # project settings: types, defaults, loading, and storage
      credentials/  # profiles and tokens kept in ~/.zoho-studio
      logger/       # pino logger, createCommandLogger per command
      utils/        # standalone helpers, exposed through index.ts
      artifacts/    # reading and writing pulled artifacts under src/
      pull/         # shared pull progress and result types
  auth/           # @zoho-studio/auth — OAuth, tokens, and the login flow; depends on core
  zoho-crm/       # @zoho-studio/zoho-crm — depends on core and auth
    src/
      api/          # Zoho CRM client and request error handling
      zoho-crm.config.ts  # names and constants that belong to this area only
      migrations/   # migrations of modules and fields, one folder per responsibility:
                    #   definition/, loader/, planning/, running/, journal/, script/
      entities/     # domain entities of this area (e.g.: field, function, module)
        <entity>/
          <entity>.types.ts   # the shape the CLI depends on
          <entity>.utils.ts   # helpers belonging to this entity — file names, ordering, validation
          api/                # requests belonging to this entity, one per file
          services/           # work built on top of the entity, when more than one caller needs it
apps/
  cli/            # the CLI; `@/` resolves to apps/cli/src
    src/
      index.ts      # CLI entry point, registers the commands
      commands/     # CLI command definitions, one folder per command
        zoho-crm/   # the commands of the Zoho CRM area; bare folders above are commands of no product
  web/            # the SPA served by `browser`; built by Vite into dist/web
tests/            # mirrors packages/*/src and apps/cli/src, see Tests
template/         # files `init` copies into a new project
```

Packages have no build step: `exports` in each `package.json` points at TypeScript sources, and
Bun runs them as they are. A package declares no dependencies at all: third-party packages and
the sibling packages are declared once, in the root `package.json`, and resolve through the root
`node_modules`. A package with its own `workspace:*` entries cannot be linked into a project
outside the repository, which `init` relies on (`bun run link`, `link:@zoho-studio/<name>`).

A package is imported by name, never by a path into another package. `@zoho-studio/zoho-crm`
exposes everything at the root — the client, config, every entity, and migrations — so a project
script needs one import; each entity and `migrations` is also a subpath
(`@zoho-studio/zoho-crm/field`). Every exported name is therefore unique across the package:
`export *` would silently drop a name two entities share, which `tests/zoho-crm/index.spec.ts`
guards against. Inside a package, imports are relative.

A function that sends an HTTP request — everything in a `*.request.ts` — ends with `Request`
(`getFieldsListRequest`, `createModuleRequest`), so a call site shows where the network is
touched. A helper that would otherwise be ambiguous names its entity
(`moduleMetadataFilePath`, not `resolveMetadataSegments`).

A command folder exposes the command and nothing else: its `index.ts` exports only the `Command`,
and whatever the command needs is either its own private file or lives in an entity. A command
never imports from another command — logic two commands share belongs in the area's
`entities/<entity>/`.

A package's `api/` folder (and the whole of `auth`) holds only infrastructure that belongs to no
single entity: base clients, HTTP configuration, authentication, and error handling. An endpoint
that belongs to a domain entity lives in `entities/<entity>/api/` instead.

The two differ in one more way. `auth` keeps its requests in a `requests/` subfolder; inside
`entities/<entity>/`, requests sit directly in `api/`.

```text
packages/auth/src/                   packages/zoho-crm/src/entities/field/
  requests/                            field.types.ts
    refresh-access-token.request.ts    api/
    index.ts                             get-fields-list.request.ts
  auth.client.ts                         index.ts
  auth.error.ts                        index.ts
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
`.store.ts`, `.loader.ts`, `.types.ts`, `.settings.ts`, `.error.ts`, `.utils.ts`, `.builder.ts`, `.schemas.ts`, `.field.ts` (a field type of a migration), `.spec.ts`.

Add a new suffix only when an existing one does not fit the responsibility.

### Exports

Use `index.ts` to expose a clear public interface for a folder when it improves imports.

```ts
import { getFunctionsListRequest } from '@zoho-studio/zoho-crm/function'
import { crmClient } from '@zoho-studio/zoho-crm'
import { getProjectSettings } from '@zoho-studio/core'
import { initCommand } from '@/commands/init'
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

Tests live in `tests/` and use the `.spec.ts` suffix. The first segment names the package or
`cli`; the rest mirrors the package's `src/`, except that a command's folder is flattened away —
command specs sit directly under `tests/cli/commands/` or `tests/cli/commands/<area>/`.

```text
packages/core/src/settings/settings.loader.ts                 ->  tests/core/settings/settings.loader.spec.ts
packages/auth/src/token.service.ts                            ->  tests/auth/token.service.spec.ts
packages/zoho-crm/src/entities/field/field.utils.ts           ->  tests/zoho-crm/entities/field/field.utils.spec.ts
apps/cli/src/commands/init/init.service.ts                    ->  tests/cli/commands/init.service.spec.ts
```

Use the built-in Bun test runner (`import { describe, expect, test } from 'bun:test'`).
Import production code the way the apps do: packages by name, CLI code through the `@/` alias,
which resolves from `tests/` as well.

Tests that need a project on disk use the shared fixture in `tests/support/temp-project.ts`
rather than rolling their own temp directory. Requests are tested against a real `Bun.serve`
stub, not a mocked axios.

Run `bun run check` (lint + typecheck + tests) before handing off a change.

## CLI command and option style

- Binary name: `zoho-studio` (`program.name()`; the build produces `dist/zoho-studio`).
- A command that belongs to a Zoho product area carries the area prefix: `z-crm:` for Zoho CRM.
  Only commands that belong to no product stay bare: `init`,
  `login`, `debug`, `browser`.
- Use `namespace:action` for grouped commands, with the namespace in the plural:
  `z-crm:functions:pull`, `z-crm:modules:pull`, `z-crm:fields:pull`.
- Use explicit named options with full names: `--module <api_name>`, `--force`, `--json`.
- A short alias must be declared in the option spec and used with a single dash (`-m`). Commander does not abbreviate long options — `--m=Leads` fails at runtime.
- Prefer a named option over a positional argument, unless the argument is the command's whole subject (`init [name]`).

```bash
zoho-studio init example-project-name
zoho-studio z-crm:status --json
zoho-studio z-crm:fields:pull --module=Leads
```
