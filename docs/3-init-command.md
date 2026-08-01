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

Next steps:
  1. Add auth.clientId and auth.clientSecret to .zoho-studio/settings.json
  2. Run "zoho-studio login"
```

A template file is reported as `created` or `skipped`; `skipped` means the file was already there
and was left alone.

## What you get

```text
my-project/
  .zoho-studio/
    .gitignore           # keeps settings.json out of git
    settings.json        # your credentials, chmod 0600
  logs/
    .gitignore           # keeps *.log out of git
  src/
```

`src/` is where every pull writes: `src/functions`, `src/modules`, `src/workflows`. Those paths are
fixed and no setting moves them. Each folder appears on the first pull that fills it.

Everything except `settings.json` comes from the template, and **an existing file is never
overwritten** — with or without `--force`. Edit the files you were given; a later `init` only fills
in what is missing. Delete one and re-run `init` to get it back.

Your project's root `.gitignore` is not touched. The two `.gitignore` files above travel with the
folders they protect, so the settings file and the logs stay out of git wherever the project sits.

Next, fill in `auth.clientId` and `auth.clientSecret` from your client in the Zoho API console. See
[2-settings.md](2-settings.md) for the rest of the file.

## When it refuses

`init` stops if `.zoho-studio/settings.json` already exists, so a stray re-run cannot wipe your
credentials. It also stops if the target path is a file rather than a folder, or if `.zoho-studio`
itself is a file.

`--force` overrides the first case only, and it is a **reset of `settings.json`, not a repair and
not a re-scaffold**: that one file goes back to the defaults, and the client secret and tokens in it
are gone. There is no undo. To change a single value, edit the file instead.

Nothing under `src/` is ever deleted by `init`, with or without `--force`.
