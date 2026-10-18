# `zoho-studio z-crm:functions:deploy`

Publishes a function from `src/zoho-crm/functions/<api_name>/` to Zoho CRM: it creates the function
the first time and updates it after that, and records each successful deployment in the function's
deploy file. Deluge functions go live as soon as Zoho accepts them — there is no separate publish
step.

```bash
zoho-studio z-crm:functions:deploy oz_sa_ping --changelog "Answer with the server time"
```

```text
Create a new function oz_sa_ping in Zoho
Changelog: Answer with the server time
✔ Deploy? Yes
Created oz_sa_ping in Zoho (id 1023338000007548001)
```

Once the local checks pass, the command says what it is about to do — create a new function, or
update the one with the stored id — shows the changelog, and asks for confirmation. Declining sends
nothing. Without a terminal it refuses to run unless `--yes` is given.

The command needs a project that has been through [`zoho-studio login`](4-login-command.md). The
function comes from [`zoho-studio z-crm:functions:make`](29-functions-make-command.md), either
scaffolded or imported.

## Options

| Option | Meaning |
|---|---|
| `<api_name>` | The function folder in `src/zoho-crm/functions/`. |
| `-y, --yes` | Deploy without asking for confirmation, for scripts and runs without a terminal. |
| `--changelog <text>` | The changelog of this deployment. Without it, the message comes from [`zohoCrm.functions.changelogTemplate`](2-settings.md), `Deployed {date}` by default, where `{date}` is the deployment date. |

## Create or update

The `id` in `<api_name>.deploy.json` decides. When it is `null`, the function is created and its new
id is written to the file; when it is set, the function with that id is updated. An imported function
carries its id from the start, so its first deploy is an update.

An update sends the code, the display name and the description. The API name, the category and the
runtime are fixed once the function exists — Zoho refuses to change them.

After Zoho accepts the change, the command appends an entry to `deployments` in the deploy file:

```json
"deployments": [
    { "date": "2026-10-18T12:00:00.000Z", "operation": "create", "changelog": "First version" }
]
```

The date is in UTC. Zoho keeps the changelog with the function's revision but does not return it
through the API, so this list is the copy you can read back.

The command does not pull afterwards: `data/` keeps the state of the last pull until you run
[`z-crm:functions:pull`](6-functions-pull-command.md). Zoho drops leading tabs and the trailing newline
from the code it stores, so a pulled snapshot does not match the source byte for byte.

## Checks before anything is sent

Nothing is sent to Zoho, and nothing is written, when:

- the function folder or its deploy file is missing;
- the deploy file breaks a rule: the display name has 3–100 characters, starts with a letter, and
  holds letters, digits, spaces, `-` and `_`; the API name follows the same rule without spaces and
  matches the folder; the description is at most 3000 characters; the runtime is `Deluge 1.0`; the
  category is one of the seven Deluge categories;
- the code does not declare `<category>.<display name>` — the category and the display name in lower
  case with spaces and `-` replaced by `_`. Zoho matches the declaration ignoring case;
- `src/zoho-crm/functions/` still holds pulled functions from before they moved to `data/` — move them
  with `mv src/zoho-crm data/zoho-crm`.

## When Zoho refuses

A refused deploy leaves the deploy file as it was and the command exits with code 1.

- **Compilation errors** are listed with the line and position Zoho reports:

  ```text
  function have compilation errors (COMPILATION_ERROR)
    line 3, position 0: The syntax is incorrect. Please check the format.
  ```

  A return type the category does not allow is reported the same way.
- **A function with the same API name already exists** (`DUPLICATE_DATA`, which Zoho checks ignoring
  case) — the command stops and suggests importing that function instead. It never binds to it on
  its own.
- **The function with the stored id no longer exists** (`INVALID_DATA`) — set `id` to `null` to create
  it again.
