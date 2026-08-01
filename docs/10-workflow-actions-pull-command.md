# `zoho-studio workflow-actions:pull`

Downloads every Zoho CRM workflow action into `src/workflow-actions/` — one JSON file per action,
grouped by action type, including the configuration that the action list alone does not carry.

```bash
zoho-studio workflow-actions:pull
```

```text
Pulling workflow actions |████████████████████| 92/92 | webhooks: SRV.Shipping_Packages.Delete
Workflow actions found: 92
Workflow actions saved: 92
Saved from the list, without details: 0
Failures: 0
```

The command needs a project that has been through [`zoho-studio login`](4-login-command.md), with
the `ZohoCRM.settings.automation_actions.READ` scope granted. Projects created before that scope
existed have to add it to `auth.scopes` in [`.zoho-studio/settings.json`](2-settings.md) and log in
again; the command says so when Zoho refuses the request.

It does not depend on any other pull command. [`workflows:pull`](9-workflows-pull-command.md)
downloads the rules that *use* these actions, and the two write to separate folders — a rule refers
to its actions by name and id, and this command is what fills those references in.

Actions are fetched one at a time — a list request per type, then one request per action for its
full record — with a short delay between them to stay clear of Zoho's API limits. An organization
with a hundred actions takes about a minute. The progress bar shows the action currently being
pulled, prefixed by its type.

## What lands on disk

```text
src/workflow-actions/
├── email-notifications/
│   └── Contractor. On Shipping Label Purchased.json
├── field-updates/
│   └── Set Recruiting Priority.json
├── functions/
│   └── OZ_Move_Files_On_Change_Topper.json
├── tasks/
│   └── Rename Routes.json
└── webhooks/
    └── SRV.Shipping_Packages.Delete.json
```

There are five action types, and each has its own folder:

| Folder | Zoho calls it | What the full record adds beyond the list |
|---|---|---|
| `email-notifications` | `email_notifications` | `recipients`, `bulk_email` |
| `field-updates` | `field_updates` | nothing — the list is already complete |
| `tasks` | `tasks` | nothing — the list is already complete |
| `webhooks` | `webhooks` | `body`, `headers`, `authentication`, `url_parameters`, `date_time_format` |
| `functions` | `functions` | `arguments` |

Each file holds the full action record as `GET /settings/automation/{type}/{id}` returned it,
formatted with a four-space indent and a trailing newline. Zoho reports no details at all for a
small number of actions it otherwise lists normally; those files hold the list entry instead, and
the run says which ones:

```text
Saved from the list, without details: 1
  - field_updates: Fill Submitted At: Zoho CRM returned no details for this action.
```

For a field update or a task that loses nothing, since the list entry is already the whole record.
For the other three types the file is a partial record — which is why it is reported rather than
passed over.

A `functions` action records which
function it calls and with what arguments; the Deluge source itself comes from
[`functions:pull`](6-functions-pull-command.md).

The folder is always `src/workflow-actions/`; no setting moves it.

**A type's folder is deleted and recreated on each full run**, so an action removed in Zoho
disappears locally and any local edit is lost. A type whose list request failed keeps its previous
contents untouched.

Files are named after the action. Only characters a path segment cannot contain are replaced;
nothing else about the name is changed. Action names are unique within a module but not across an
organization, so when two actions of the same type would claim the same file name the second one
carries its action id as well — `Send Reminder.6640142000024463018.json`. Actions are processed in a
fixed order, so a full run always names them the same way.

## Narrowing the run

`--type` pulls a single action type, and accepts either the folder name or the name Zoho uses:

```bash
zoho-studio workflow-actions:pull --type=webhooks
zoho-studio workflow-actions:pull --type=email-notifications
```

Only that type's folder is rewritten; the other four are left alone.

`--module` narrows the run to the actions of a single module:

```bash
zoho-studio workflow-actions:pull --module=Deals
```

This run does **not** wipe any folder. In each type's folder it removes only the files whose action
belongs to that module — each file records its own module, so the owner is read back out of the
file — and leaves every other action where it is. A file that cannot be read as an action is left
alone rather than guessed about.

The two options combine, and each is validated before anything is deleted: `--module` takes a
module API name, `--type` one of the five types above.

```bash
zoho-studio workflow-actions:pull --module=Deals --type=webhooks
```

## Failures

Nothing here is fatal, because each type is independent.

An action whose full record cannot be fetched — a rejected request, not the empty answer above — is
listed in the summary with a short error, and the remaining actions are still pulled. A type whose
*list* cannot be fetched is reported the same way, its folder is left as it was, and the other types
still run.

```text
Failures: 1
  - tasks: permission denied (OAUTH_SCOPE_MISMATCH) — add "ZohoCRM.settings.automation_actions.READ" to auth.scopes in .zoho-studio/settings.json and run "zoho-studio login" again.
```

## Logs

The CLI writes structured JSON logs to [`logs.file`](2-settings.md), `logs/zoho-studio-cli.log` by
default. `workflow-actions:pull` records the start of the run, how many actions were found across
how many types, the final counts, and every failure with its stack trace. Individual successful
actions are not logged — the progress bar already shows them.
