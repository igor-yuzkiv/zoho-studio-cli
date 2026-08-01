# `zoho-studio webhooks:pull`

Downloads every Zoho CRM webhook into a flat `src/webhooks/` folder — one JSON file per webhook,
including the request body, headers, URL parameters, and authentication that the webhook list alone
does not carry.

```bash
zoho-studio webhooks:pull
```

```text
Pulling webhooks |████████████████████| 30/30 | SRV.Programs.Delete
Webhooks found: 30
Webhooks saved: 30
Webhooks failed: 0
```

The command needs a project that has been through [`zoho-studio login`](4-login-command.md), with
the `ZohoCRM.settings.automation_actions.READ` scope granted. Without it Zoho answers
`OAUTH_SCOPE_MISMATCH`; the scope is in the default [settings](2-settings.md), so a project
scaffolded before it was added has to be re-authorized.

Webhooks are the actions a [workflow rule](9-workflows-pull-command.md) invokes. That command
records them only as references — name, id, type — so this one is what puts their actual contents on
disk. Neither command feeds the other: they call different endpoints and write to different folders.

Webhooks are fetched one at a time — a list request, then one request per webhook for its full
record — with a short delay between them to stay clear of Zoho's API limits. The progress bar shows
the webhook currently being pulled.

## What lands on disk

```text
src/webhooks/
├── SRV.Programs.Delete.json
├── SRV.Shipping_Packages.Upsert.json
└── Notify Billing.json
```

Each file holds the full webhook record as `GET /settings/automation/webhooks/{id}` returned it,
formatted with a four-space indent and a trailing newline. That record includes `url`,
`http_method`, `body`, `headers`, `url_parameters`, and `authentication` — the parts that describe
what the webhook actually sends. Note that `authentication` names the connection Zoho uses; no
secret is part of the response.

The folder is always `src/webhooks/`; no setting moves it.

**The whole folder is deleted and recreated on each run**, so a webhook removed in Zoho disappears
locally and any local edit is lost.

Files are named after the webhook. Only characters a path segment cannot contain are replaced;
nothing else about the name is changed. When two webhooks would claim the same file name the second
one carries its id as well — `Notify Billing.6640142000024463018.json`. Webhooks are processed in a
fixed order — by module, then name, then id — so a run always names them the same way.

The command pulls the whole organization; there is no `--module` option.

## Which rules use a webhook

Not pulled. Zoho reports that separately, through
`settings/automation/webhooks/{id}/actions/associations`, and this command does not call it. The
reverse direction is available: a rule file from [`workflows:pull`](9-workflows-pull-command.md)
lists the webhooks it invokes.

## Failures

A webhook whose full record cannot be fetched does not stop the run: it is listed in the summary
with a short error, the remaining webhooks are still pulled, and the command still succeeds.

```text
Webhooks failed: 1
  - SRV.Programs.Delete: permission denied (OAUTH_SCOPE_MISMATCH)
```

Failing to fetch the webhook *list* is fatal — there is nothing to write.

## Logs

The CLI writes structured JSON logs to [`logs.file`](2-settings.md), `logs/zoho-studio-cli.log` by
default. `webhooks:pull` records the start of the run, how many webhooks were found, the final
counts, and every failure with its stack trace. Individual successful webhooks are not logged — the
progress bar already shows them.
