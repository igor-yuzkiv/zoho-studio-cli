# zoho-studio

`zoho-studio` represents Zoho resources as local files, so Zoho work fits a normal engineering
workflow: git, scripts, review. These instructions are for an agent working in a zoho-studio
project. They describe what the CLI does and what it does not; options are in `--help`.

## The project

A project is a folder with `.zoho-studio/settings.json`. Commands find it by walking up from the
current folder, so they work from any subfolder; outside a project they stop and point at
`zoho-studio init`.

- `data/` — what pulls downloaded from Zoho, at fixed paths (`data/zoho-crm/functions`,
  `data/zoho-crm/modules`, …). A pull rewrites it: never edit files there by hand.
- `data/.removed/<date-time>/` — what a pull found deleted in Zoho, moved here instead of erased.
  Out of git.
- `src/zoho-crm/functions/` — functions developed locally and deployed from here.
- `migrations/zoho-crm/` — migration files, run with `bun run migrate`.
- `widgets/` — widget folders for local runs and e2e tests.
- `scripts/` — TypeScript scripts that use the `@zoho-studio/*` packages. Their CRM client reads
  only: any request that can change the organization fails with `CRM_WRITES_DISABLED` until the
  script calls `allowCrmWrites()`.
- `.zoho-studio/settings.json` — data center, scopes, presets, naming. No secrets: tokens and client
  secrets live in `~/.zoho-studio`, outside the project.
- `logs/zoho-studio-cli.log` — structured JSON log of every command; details of a failure are there.

## Where to start

1. `zoho-studio z-crm:status` — confirms the project is logged in and shows the organization and
   whether it is a sandbox. If it says "This project is not authorized yet", the person has to run
   `zoho-studio login`.
2. Look at what is already pulled in `data/`. To refresh everything: `zoho-studio preset pull-crm`.
3. Read `zoho-studio instructions <command>` before using a command for the first time.

## Guides

Some groups carry more than their commands — read them before that kind of work:

- `zoho-studio instructions z-crm` — what is pulled, how to read `data/zoho-crm/` and what refers to
  what (rules, actions, webhooks, functions, client scripts).
- `zoho-studio instructions z-crm:functions` — the files of a function, declarations and categories,
  how Zoho treats the code, reading a run.
- `zoho-studio instructions z-crm:migrations` — writing a migration: format, field types, checks,
  running it, the journal.
- `zoho-studio instructions z-crm:widgets` — testing a widget: scenarios, mocks, Playwright tests;
  the mock keys and SDK answer shapes are in `z-crm:widgets:serve`.

## Reading the result

Rely on the exit code: `0` — success, non-zero — failure. A pull that wrote most items but failed
some still writes what it could, lists the failures in its summary, and exits with `1`. Messages go
to the terminal; the stack traces go to the log.

## What writes to Zoho

Most commands only read from Zoho or work offline. These change the organization:

- `z-crm:functions:deploy` — creates or updates a function; it goes live at once.
- `z-crm:functions:run` — executes a function for real: records, emails, webhooks it touches.
- `bun run migrate` (a project script, not a CLI command) — creates modules and fields; cannot be
  undone.

Each of them asks for confirmation. Do not pass `--yes`/`--force` unless the person agreed to that
specific run, and prefer a sandbox organization.

## What the CLI does not do

Do not invent commands for these; there are none:

- Deploy anything other than Deluge functions: no push of modules, fields, layouts, workflow rules,
  webhooks, client scripts, static resources, or widgets.
- Change or delete existing modules and fields (migrations only create).
- Read or write CRM records (data); only metadata and code.
- Manage credential profiles beyond `login` (no list or remove).
- Cover Zoho products other than CRM.
- Run widgets inside real Zoho, or build and serve widget code — the widget must already run at its
  own address.

For these, work in the Zoho UI, or write a project script on the packages — the `scripts` skill of
the zoho-studio plugin — and say so to the person.
