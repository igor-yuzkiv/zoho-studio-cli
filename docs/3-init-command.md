# `zoho-studio init`

Scaffolds a Zoho Studio project: creates the project tree from a template built into the CLI, and
writes `.zoho-studio/settings.json` filled with the defaults.

```bash
zoho-studio init                 # current folder
zoho-studio init my-project      # creates the folder if it is missing
zoho-studio init --force         # reset settings.json to the defaults
```

The output tells you what changed:

```text
Initialized Zoho Studio project in my-project
  .zoho-studio/settings.json — created
  src/.gitkeep — created
  logs/.gitignore — created
  .zoho-studio/.gitignore — created
  .gitignore — created
  package.json — created
  tsconfig.json — created
  scripts/example.ts — created

Next steps:
  Run "zoho-studio login" and choose or create a credential profile
  Run "bun run link" once in the framework repository, then "bun install" here, to use the packages from scripts/
```

A template file is reported as `created` or `skipped`; `skipped` means the file was already there
and was left alone.

## What you get

```text
my-project/
  .gitignore             # keeps node_modules out of git
  .zoho-studio/
    .gitignore           # keeps settings.json and org.json out of git
    settings.json        # project settings, chmod 0600
  logs/
    .gitignore           # keeps *.log out of git
  package.json           # the framework packages as link: dependencies
  scripts/
    example.ts           # a script to copy: counts the fields of every pulled module
  src/
  tsconfig.json          # type-checks scripts/ against the packages' sources
```

`src/` is where every pull writes: `src/zoho-crm/functions`, `src/zoho-crm/modules`, `src/zoho-crm/workflows`. Those paths are
fixed and no setting moves them. Each folder appears on the first pull that fills it.

Everything except `settings.json` comes from the template, and **an existing file is never
overwritten** — with or without `--force`. Edit the files you were given; a later `init` only fills
in what is missing. Delete one and re-run `init` to get it back.

A root `.gitignore` is created only when the project has none; an existing one is left exactly as
it is. The two `.gitignore` files inside the folders travel with what they protect, so the settings
file, the organization snapshot, and the logs stay out of git wherever the project sits.

## Scripts

`package.json` lists the four framework packages — `@zoho-studio/core`, `@zoho-studio/auth`,
`@zoho-studio/zoho-crm`, `@zoho-studio/zoho-projects` — as `link:` dependencies, resolved by name
from Bun's link registry rather than by a path. Register them once per machine, from the clone of
the framework repository:

```bash
bun run link        # in the framework repository; `bun run unlink` reverses it
```

Then, in the project:

```bash
bun install
bun run scripts/example.ts
```

The link is live: the project sees the packages' sources as they are in the repository, with no
build or reinstall after a change there. `bunx tsc --noEmit` in the project type-checks `scripts/`
against those sources. Re-run `bun run link` after moving the repository.

`scripts/example.ts` reads the local artifacts only, so it runs before any login; it tells you
which pulls to run when `src/zoho-crm/modules` is still empty. Copy it to start a script of your
own.

Next, run [`zoho-studio login`](4-login-command.md): it lets you choose a stored credential profile
or create one from your client in the Zoho API console. See [2-settings.md](2-settings.md) for the
rest of the settings file.

## When it refuses

`init` stops if `.zoho-studio/settings.json` already exists, so a stray re-run cannot wipe your
settings. It also stops if the target path is a file rather than a folder, or if `.zoho-studio`
itself is a file.

`--force` overrides the first case only, and it is a **reset of `settings.json`, not a repair and
not a re-scaffold**: that one file goes back to the defaults, and every value you set in it is
gone; the profiles and tokens in `~/.zoho-studio` are not touched. There is no undo. To change a single value, edit the file instead.

Nothing under `src/` is ever deleted by `init`, with or without `--force`.
