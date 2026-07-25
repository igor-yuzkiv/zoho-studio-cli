# Settings

A project keeps everything it needs in **one file**: `.zoho-studio/settings.json`. Every command
reads it, and [`zoho-studio init`](3-init-command.md) creates it.

**The file is a secret.** It stores the client secret and the refresh token, so it is listed in
`.gitignore` and restricted to `chmod 0600`. Never commit it, and treat a leak as if a password
leaked.

## The file

```json
{
    "auth": {
        "baseUrl": "https://accounts.zoho.com",
        "scopes": [
            "ZohoCRM.settings.modules.READ",
            "ZohoCRM.settings.fields.READ",
            "ZohoCRM.settings.workflow_rules.READ",
            "ZohoCRM.settings.functions.READ",
            "ZohoCRM.org.READ"
        ],
        "clientId": "",
        "clientSecret": "",
        "tokens": {
            "accessToken": "",
            "refreshToken": "",
            "accessTokenExpiresAt": 0
        }
    },
    "api": {
        "baseUrl": "https://www.zohoapis.com",
        "version": "v8"
    }
}
```

There are two kinds of values in there, and the difference matters when you edit the file by hand:

- `auth.baseUrl`, `auth.scopes`, `auth.clientId`, `auth.clientSecret`, `api.*` — **yours**. You
  fill them in, the CLI only reads them.
- `auth.tokens.*` — **the CLI's**. It writes them and keeps them up to date.

Every key is optional. Anything you leave out falls back to a built-in default, so a file with only
`clientId` and `clientSecret` is a valid project. That also means you can delete a key to return to
the default instead of hunting for the original value.

## How reading works

`loadProjectSettings()` reads the file through [bunfig](https://github.com/stacksjs/bunfig) and
deep-merges it into the defaults. `getProjectSettings()` wraps it with a cache, and is what
commands call.

Three behaviors worth knowing before you rely on them:

- **A missing file is not an error.** You get the defaults, so the return value cannot tell you
  whether a folder is a project.
- **Environment variables are ignored.** bunfig would otherwise map a `SETTINGS_*` prefix onto the
  defaults, and a stray `SETTINGS_API_BASEURL` in your shell would silently replace a value the
  project file never mentioned. That is turned off.
- **Reads are cached for the lifetime of the process.** A single run reads the settings from
  several places and should see one consistent picture, so edits made from outside while a command
  runs are not picked up.

## How writing works

bunfig only reads, so `saveProjectSettings()` writes the file itself: it serializes the whole
object as JSON, creates the folder if needed, applies `chmod 0600`, and updates the cache so the
rest of the run sees the new values.

It always writes the **whole** object. To change one value, read the settings, change the field,
and write the result back — do not hand it a partial object.

## Where the code lives

| File | Role |
| --- | --- |
| `src/config.ts` | File and folder names, path helpers, the `.gitignore` entry |
| `src/settings/types.ts` | The `ProjectSettings` shape |
| `src/settings/default.settings.ts` | The defaults every read merges into |
| `src/settings/settings.loader.ts` | `loadProjectSettings()` |
| `src/settings/settings.store.ts` | `getProjectSettings()`, `saveProjectSettings()`, the cache |
