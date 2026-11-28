# z-crm:functions — Deluge functions

Functions are the one CRM resource the CLI changes. Two places hold them:

- `data/zoho-crm/functions/<api_name>/` — the snapshot of the last pull:
  `<Display Name>.metadata.json` (the record as Zoho lists it) and `<Display Name>.deluge` (the
  code, verbatim). Read-only: every pull rewrites it.
- `src/zoho-crm/functions/<api_name>/` — the source you edit and deploy: `<api_name>.deluge` and
  `<api_name>.deploy.json`.

## The usual flow

1. `z-crm:functions:pull` — refresh the snapshot.
2. An existing function: `z-crm:functions:import <api_name>` copies it into `src/` with its CRM id.
   A new one: `z-crm:functions:make` is interactive — ask the person, or write both files by hand
   as shown below.
3. Edit `<api_name>.deluge`.
4. `z-crm:functions:run <api_name> --from src --arg name=value … --dry-run` prints the command;
   running it for real executes the code in Zoho — records, emails, webhooks happen.
5. `z-crm:functions:deploy <api_name> --changelog "<what changed>"` — when the person agreed. The
   function goes live at once.
6. `z-crm:functions:pull` to see what Zoho stored.

## The two files in `src/`

```json
{
    "id": null,
    "name": "Refresh Pricing",
    "api_name": "oz_wf_programs_refresh_pricing",
    "description": "Recalculates the program prices",
    "runtime": "Deluge 1.0",
    "category": "Automation",
    "deployments": []
}
```

- `id` — `null` until the function exists in Zoho; then the CRM id, and a deploy updates it.
- `name` — the display name: 3–100 characters, starts with a letter; letters, digits, spaces, `-`, `_`.
- `api_name` — the same without spaces, equal to the folder name. Unique in the organization
  ignoring case, and never changeable after creation.
- `description` — up to 3000 characters.
- `runtime` — only `Deluge 1.0` is supported.
- `category` — one of the seven below; fixed after creation.
- `deployments` — the CLI appends `{ date, operation, changelog }` after each deploy; Zoho keeps
  changelogs but never returns them, so this is the only readable history.

The `.deluge` file is the whole function, declaration included:

```text
void automation.refresh_pricing(String programId, Int count)
{
	info programId;
}
```

The declaration is `<return type> <category>.<display name>(<arguments>)`, where the category and the
display name are lower case with spaces and `-` replaced by `_` (Zoho compares ignoring case).
Arguments are declared here and nowhere else.

| Category | Return type |
|---|---|
| Button | `string` |
| Automation | `void` or `string` |
| Schedule | `void` |
| Related List | `string` |
| Standalone | `string` |
| Signals | `void` |
| Validation Rule | `map` |

A return type the category does not allow is a compilation error.

## How Zoho treats the code

- Zoho drops leading tabs and the trailing newline from the code it stores, so a pulled snapshot
  never matches `src/` byte for byte — compare the logic, not the bytes.
- Compilation errors come with a line and a position:
  `line 3, position 0: The syntax is incorrect. Please check the format.`
- `DUPLICATE_DATA` on deploy — a function with that API name already exists (ignoring case): pull
  and import it, never create a second one. `INVALID_DATA` on update — the stored id was deleted in
  Zoho: set `id` to `null` to create it again.

## Reading a run

`z-crm:functions:run` prints Zoho's answer as JSON:

```json
{
    "status": "success",
    "output": { "line_number": 11, "data_type": "string", "value": "test" },
    "logs": [{ "line_number": 3, "category": "info", "data_type": "string", "value": "1" }],
    "metrics": { "statements_executed": 7, "time_taken_in_ms": 6, "send_mail": 0, "webhook": 0 }
}
```

`logs` holds one entry per `info` statement — add `info` lines to see intermediate values. The exit
code is `1` when `status` is not `success`. Argument values are sent as text, like Zoho's editor
does. Zoho runs exactly the code sent and saves nothing.

## Where functions are used

A workflow rule calls a function through a `functions` action: its file in
`data/zoho-crm/workflow-actions/functions/` names the function and the arguments it passes. The CLI
pulls no buttons, related lists or schedules, so where those use a function is not on disk.
