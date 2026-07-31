# Zoho Studio CLI

A Bun + TypeScript CLI that represents Zoho CRM resources — functions, modules, fields, workflow
rules — as local files, so Zoho development fits normal engineering workflows.

Run `bun run check` (lint + typecheck + tests) before handing off a change.

## Commands

```bash
bun run dev -- --help   # run the CLI from source
bun run check           # lint + typecheck + tests
bun test tests/settings/settings.loader.spec.ts   # a single spec
bun run build           # bundle → dist/zoho-studio
bun run compile         # standalone executable → dist/zoho-studio
```

## What a project is

Every command except `init` operates on a **project**: the nearest ancestor folder containing
`.zoho-studio/settings.json`, so commands work from a nested directory. That one file holds the
Zoho account, the API base URL and version, and the credentials. There is no global configuration,
and settings are deliberately not read from the environment.

`.zoho-studio/settings.json` carries the client secret and the refresh token. It is gitignored, and
reading or editing it is denied in `.claude/settings.json` — treat its contents as unavailable and
work from `src/settings/types.ts` and `src/settings/default.settings.ts` instead.

## Things that are not visible from a single file

- **Running a command can rewrite settings.** `TokenService` refreshes an expired access token and
  persists it back into `.zoho-studio/settings.json`. A command that only reads from Zoho still
  writes locally.
- **`tokenService` is a module-level singleton** and de-duplicates concurrent refreshes on purpose:
  Zoho caps how often one refresh token may be exchanged.
- **Zoho reports OAuth failures as HTTP 200** with an `error` field in the body, so a successful
  status code is not a successful auth response.
- **Clients configure themselves.** `crm.client.ts` and `auth.client.ts` resolve the base URL and
  the `Authorization` header inside their interceptors. A request file never builds a client and
  never touches tokens.
- **`loadProjectSettings` returns the defaults for a missing or unparseable file**, so it cannot be
  used to decide whether a folder is a project. Use `findProjectPath` for that.
- **`checkEnv: false` in `settings.loader.ts` is load-bearing.** bunfig would otherwise derive a
  `SETTINGS_*` env prefix and let a stray ambient variable replace a default.
- **`@/` resolves to `src/`**, from `tests/` as well.

## Where the rules are

- `.claude/rules/architecture.md` — folder layout, file naming, exports, tests, CLI option style
- `.claude/rules/git.md` — commit format and `ZS-<number>` task references
- `.claude/rules/documentation.md` — `docs/` is flat, numbered, and describes only shipped behavior
- `docs/1-overview.md` — the user-facing entry point; a new command needs a page there, plus an
  entry in that overview and in `README.md`
