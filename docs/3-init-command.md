# `zoho-studio init`

Creates a Zoho Studio project: writes `.zoho-studio/settings.json` filled with the defaults, and
adds it to `.gitignore` because it will hold your credentials.

```bash
zoho-studio init                 # current folder
zoho-studio init my-project      # creates the folder if it is missing
zoho-studio init --force         # start over from the defaults
```

The output tells you what changed:

```text
Initialized Zoho Studio project in my-project
  .zoho-studio/settings.json — created
  .gitignore — created
```

`.gitignore` is reported as `created`, `updated`, or `unchanged`. An existing file is appended to,
never overwritten, and the entry is not duplicated on a repeated run.

Next, fill in `auth.clientId` and `auth.clientSecret` from your client in the Zoho API console. See
[2-settings.md](2-settings.md) for the rest of the file.

## When it refuses

`init` stops if `.zoho-studio/settings.json` already exists, so a stray re-run cannot wipe your
credentials. It also stops if the target path is a file rather than a folder, or if `.zoho-studio`
itself is a file.

`--force` overrides the first case only, and it is a **reset, not a repair**: the file goes back to
the defaults, and the client secret and tokens in it are gone. There is no undo. To change a single
value, edit the file instead.
