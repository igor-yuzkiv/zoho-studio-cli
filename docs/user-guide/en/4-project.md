# The project

A project is a folder with `.zoho-studio/settings.json` in it. `zoho-studio init` creates it;
every command works from the project folder or any folder inside it.

```text
my-crm/
  .zoho-studio/
    settings.json          which Zoho region to use, what to ask permission for, presets
    org.json               the organization the project is logged in to
    migrations.json        which migrations ran, per organization
  src/zoho-crm/            everything downloaded from the CRM
  migrations/zoho-crm/     migration files you write
  logs/                    the log of every command
  scripts/                 scripts you write, including the migrate script
  package.json             the packages scripts and migrations use
  tsconfig.json            type-checks scripts and migrations against the packages
```

## Settings

`.zoho-studio/settings.json` holds no secrets. Every key in it is optional: what you leave out
falls back to the default. The ones you are most likely to touch:

- `auth.baseUrl`, `api.baseUrl` — your Zoho data center, see
  [Connecting to Zoho](3-zoho-connection.md#data-centers);
- `presets` — your own sequences of commands, see [Pulling](5-pulling.md#presets).

The full description is in the [settings reference](../../2-settings.md).

## What goes into git

`init` prepares the project for git:

- **kept out:** `settings.json`, `org.json`, `migrations.json`, the logs, `node_modules`;
- **meant to be committed:** `src/`, `migrations/`, `scripts/`, `package.json`, `tsconfig.json`.

Credentials are not in the project at all — they are in `~/.zoho-studio`.

## Scripts and migrations

`scripts/` and `migrations/` hold TypeScript files that use the packages Zoho Studio ships. To run
them, the packages have to be linked once on your machine (`bun run link` in the Zoho Studio
repository, see the [README](../../../README.md#getting-the-cli)) and installed in the project:

```bash
bun install
```

Migrations are described in [Migrations](7-migrations.md), scripts in [Scripts and packages](9-scripts-and-packages.md). More on the project files:
[init reference](../../3-init-command.md).
