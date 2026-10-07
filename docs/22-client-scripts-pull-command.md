# `zoho-studio z-crm:client-scripts:pull`

Downloads every Zoho CRM client script of the project into `src/zoho-crm/client-scripts/` — one
directory per script, holding its metadata and its JavaScript source.

```bash
zoho-studio z-crm:client-scripts:pull
```

```text
Pulling client script pages |████████████████████| 39/39 | _no-module/commands
Pages found: 39
Scripts found: 61
Source downloaded: 60
Failed: 1
  - Programs/module_edit.Standard__s/Validate Shifts (6640142000002968001): Request failed with status code 404
```

The command needs a project that has been through [`zoho-studio login`](4-login-command.md). It
reads with the `ZohoCRM.settings.client_scripts.READ` scope, which is in the default scopes.

## What lands on disk

Files are written under the project root — the folder holding `.zoho-studio/`, not the current
directory.

```text
src/zoho-crm/client-scripts/
├── Programs/
│   ├── module_create.Weekend_Awareness/
│   │   ├── page.metadata.json
│   │   ├── WA.FilterContractorByLayout.6640142000000521219/
│   │   │   ├── WA.FilterContractorByLayout.metadata.json
│   │   │   └── WA.FilterContractorByLayout.js
│   │   └── Programs Create Populate Human.6640142000001000061/
│   │       └── …
│   └── module_view_canvas.Standard__s.Weekend Directions/
│       └── …
└── _no-module/
    └── commands/
        └── …
```

Client scripts in Zoho belong to a page: a module screen (`module_create`, `module_edit`,
`module_clone`, `module_detail`, `module_view_canvas`) of one layout, or the `commands` page that
belongs to no module. The tree follows that:

- **Module directory** — the module's display label, as the CRM UI shows it; a page without a
  module goes to `_no-module/`.
- **Page directory** — the page definition, then the layout API name and the canvas name when the
  page has them. Should two pages of a module arrive at the same name, the later one by id gets
  its id appended. `page.metadata.json` holds the page record exactly as Zoho returned it.
- **Script directory** — the script name and its id. The id is always there, because Zoho allows
  two scripts of the same name on one page.

`*.metadata.json` holds the full script record exactly as the list endpoint returned it — event,
state, precedence, authors and dates — formatted with a four-space indent and a trailing newline.
`*.js` holds the source as its author wrote it, never formatted or parsed. Only characters a path
segment cannot contain are replaced in names.

The source is read from the script's hosting url, the file the CRM web UI loads, and not from the
settings `/code` endpoint, which answers a transpiled form of the script. The hosting url lies
outside Zoho CRM and is requested without the OAuth token, the way the web UI requests it.

Zoho exposes no earlier revisions of a script, so the pull holds the current version only. Commit
the pulled tree to keep a history.

**The target directory is deleted and recreated on every run.** It always reflects the current pull,
so a script removed in Zoho disappears locally, and any local edit inside it is lost.

## Failures

A page whose scripts cannot be listed, or a script whose source cannot be fetched, does not stop the
run: what could be written is written, and the failure is listed in the summary with a short
error. The command still succeeds.

Failing to fetch the page list itself is fatal, since there would be nothing to write.

Pages are requested one at a time with a short delay between them to stay clear of Zoho's API
limits.

## Logs

The CLI writes structured JSON logs to [`logs.file`](2-settings.md), `logs/zoho-studio-cli.log` by
default. `z-crm:client-scripts:pull` records the start of the run, how many pages were found, the
final counts, and every failure with its stack trace. Tokens and authorization headers are never
logged.
