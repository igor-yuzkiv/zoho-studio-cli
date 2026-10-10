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
      entities/     # domain entities of this area (e.g.: field, function, module)
        <entity>/
          <entity>.types.ts   # the shape the CLI depends on
          <entity>.utils.ts   # helpers belonging to this entity — file names, ordering, validation
          api/                # requests belonging to this entity, one per file
          services/           # work built on top of the entity, when more than one caller needs it
  zoho-projects/  # @zoho-studio/zoho-projects — same shape as zoho-crm, plus md/ and raw/
apps/
  cli/            # the CLI; `@/` resolves to apps/cli/src
    src/
      index.ts      # CLI entry point, registers the commands
      commands/     # commands that belong to no Zoho product: init, login, debug, browser
      zoho-crm/commands/      # CLI command definitions of the area, one folder per command
      zoho-projects/commands/
  web/            # the SPA served by `browser`; built by Vite into dist/web
tests/            # mirrors packages/*/src and apps/cli/src, see Tests
template/         # files `init` copies into a new project
```

Packages have no build step: `exports` in each `package.json` points at TypeScript sources, and
Bun runs them as they are. Third-party dependencies stay in the root `package.json`; a package
declares only the sibling packages it imports, as `"workspace:*"`.

A package is imported by name, never by a path into another package. `@zoho-studio/zoho-crm`
exposes its client, config and organization store at the root and each entity as a subpath
(`@zoho-studio/zoho-crm/field`), because several entities export helpers with the same name.
Inside a package, imports are relative.

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
`.store.ts`, `.loader.ts`, `.types.ts`, `.settings.ts`, `.error.ts`, `.utils.ts`, `.spec.ts`.

Add a new suffix only when an existing one does not fit the responsibility.

### Exports

Use `index.ts` to expose a clear public interface for a folder when it improves imports.

```ts
import { getFunctionsList } from '@zoho-studio/zoho-crm/function'
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
command specs sit directly under `tests/cli/commands/` or `tests/cli/<area>/commands/`.

```text
packages/core/src/settings/settings.loader.ts                 ->  tests/core/settings/settings.loader.spec.ts
packages/auth/src/token.service.ts                            ->  tests/auth/token.service.spec.ts
packages/zoho-crm/src/entities/field/field.utils.ts           ->  tests/zoho-crm/entities/field/field.utils.spec.ts
apps/cli/src/commands/init/init.service.ts                    ->  tests/cli/commands/init.service.spec.ts
apps/cli/src/zoho-projects/commands/tasks/pull-tasks.command.ts -> tests/cli/zoho-projects/commands/pull-tasks.command.spec.ts
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
- A command that belongs to a Zoho product area carries the area prefix: `z-crm:` for Zoho CRM,
  `z-projects:` for Zoho Projects. Only commands that belong to no product stay bare: `init`,
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
