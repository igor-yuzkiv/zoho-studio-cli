# Settings

A project keeps everything it needs in **one file**: `.zoho-studio/settings.json`. Every command
reads it, and [`zoho-studio init`](3-init-command.md) creates it.

**The file holds no secrets.** Client secrets and tokens live outside the project, in
`~/.zoho-studio` — see [`zoho-studio login`](4-login-command.md). `init` still puts a `.gitignore`
next to the file, which keeps it and `org.json` out of git, and writes it with `chmod 0600`.

## The file

```json
{
    "auth": {
        "baseUrl": "https://accounts.zoho.com",
        "scopes": {
            "crm": [
                "ZohoCRM.settings.modules.READ",
                "ZohoCRM.settings.fields.READ",
                "ZohoCRM.settings.workflow_rules.READ",
                "ZohoCRM.settings.functions.READ",
                "ZohoCRM.org.READ",
                "ZohoCRM.settings.client_scripts.READ",
                "ZohoCRM.settings.static_resources.READ",
                "…"
            ],
            "projects": [
                "ZohoProjects.milestones.READ",
                "ZohoProjects.tasklists.READ",
                "ZohoProjects.tasks.READ",
                "ZohoProjects.bugs.READ"
            ]
        }
    },
    "api": {
        "baseUrl": "https://www.zohoapis.com",
        "version": "v8"
    },
    "logs": {
        "file": "logs/zoho-studio-cli.log"
    },
    "projects": {
        "baseUrl": "https://projectsapi.zoho.com",
        "portalId": "",
        "projectId": "",
        "mdPath": ""
    },
    "presets": {
        "pull-crm": ["z-crm:org:info", "z-crm:modules:pull", "…"],
        "pull-render-projects": ["z-projects:milestones:pull", "…"]
    }
}
```

**Where the pulled files go is not configurable.** Every artifact lands under `src/` at a fixed
path — `src/zoho-crm/functions`, `src/zoho-crm/modules`, `src/zoho-crm/workflows` — so that the CLI can rely on the layout.
See [`zoho-studio init`](3-init-command.md) for the whole tree.

Every value in the file is **yours**: you fill it in, the CLI only reads it.

`logs.file` is where every command writes its log, relative to the project root, and its folder is
created on the first line written. The default is `logs/zoho-studio-cli.log`, and the `logs/`
folder `init` creates carries a `.gitignore` that keeps `*.log` out of git. Point this somewhere
else and that no longer applies — add the new path to your `.gitignore` yourself.

`auth.scopes` is the permission list [`zoho-studio login`](4-login-command.md) asks Zoho for, and
the same list appears on the consent screen. It is split by product: the default login asks for
`crm` and `projects` together, a separate Projects login only for `projects`. A file from before
the split holds one flat list; the CLI sorts it on read, `ZohoProjects.*` into `projects` and
everything else into `crm`. Trim it to what you actually use — a scope the CLI
never received is a scope it cannot silently use. Zoho fixes the scopes at the moment you consent,
so a project authorized before the `ZohoProjects.*` scopes were added has to run `login` again
before any `z-projects:*` command works, and the same holds for the client script and static
resource scopes and their `z-crm:*:pull` commands.

`projects` names the one Zoho Projects project the `z-projects:*` commands read. `portalId` and
`projectId` are both in the browser URL of the project —
`https://projects.zoho.com/portal/<portal name>#/projects/<projectId>/…` shows the project id, and
the portal id is on the portal's settings page. `init` leaves both empty; a `z-projects:*` command
stops with the name of the empty field before any request. `baseUrl` is the API host of your data
center, separate from `api.baseUrl` because the two products live on different domains. `mdPath`
is where [`z-projects:tasks:render`](19-z-projects-tasks-render-command.md) writes the markdown
catalogue — empty for `src/zoho-projects/md/` inside the workspace, or a path (absolute, or
relative to the workspace root) such as an Obsidian vault folder. Renders add to the folder and
overwrite their own files; anything else in it is left alone.

`presets` names command sequences for [`zoho-studio preset`](24-preset-command.md). Like any other
section, it merges with the built-in one by key, so a preset you add sits next to
`pull-crm` and `pull-render-projects` instead of removing them.

Every key is optional. Anything you leave out falls back to a built-in default, so an empty object
is a valid project. A key you do write **replaces** the default rather
than adding to it — that holds for the lists too, so a shortened `auth.scopes`
stays exactly as short as you wrote it. That also means you can delete a key to return to
the default instead of hunting for the original value.

A key the CLI does not know is kept and ignored. `auth.clientId`, `auth.clientSecret`, and
`auth.tokens` from a project created before the credential store are ignored too, with a warning on
every run. A project created before the paths were fixed
still carries its `crm` section, and one created before the `sync` command was removed carries a
`sync` section — both now do nothing, delete them when they bother you. Such a
project also saved its Deluge files under whatever `code_extension` said; the next
`z-crm:functions:pull` writes `.deluge` files and leaves the old ones beside them.

## How reading works

`loadProjectSettings()` reads the file through [bunfig](https://github.com/stacksjs/bunfig) and
deep-merges it into the defaults. `getProjectSettings()` wraps it with a cache, and is what
commands call: it walks up from the current folder to the nearest project root and returns both
that path and the settings, so a command works from any subfolder and no command has to look for
the project itself.

Three behaviors worth knowing before you rely on them:

- **Outside a project it fails.** `getProjectSettings()` throws with a hint to run `init` when no
  parent folder holds a settings file. Only the lower-level `loadProjectSettings()` silently
  returns the defaults for a missing file.
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
| `src/config.ts` | File and folder names shared by every area, and path helpers |
| `src/zoho-crm/zoho-crm.config.ts` | The fixed CRM artifact folder names |
| `src/settings/types.ts` | The `ProjectSettings` shape |
| `src/settings/default.settings.ts` | The defaults every read merges into |
| `src/settings/settings.loader.ts` | `loadProjectSettings()`, `findProjectPath()` |
| `src/settings/settings.store.ts` | `getProjectSettings()`, `saveProjectSettings()`, the cache |

`saveProjectSettings()` takes the project path explicitly — `init` writes the very first settings
file, when there is no project to find yet.
