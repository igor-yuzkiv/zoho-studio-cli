# `zoho-studio z-crm:static-resources:pull`

Downloads every Zoho CRM static resource — the JavaScript files client scripts load — into
`src/zoho-crm/static-resources/`, one directory per resource, holding its metadata and its file.

```bash
zoho-studio z-crm:static-resources:pull
```

```text
Pulling static resources |████████████████████| 15/15 | billingDefault
Static resources found: 15
Metadata saved: 15
Files downloaded: 15
Files failed: 0
```

The command needs a project that has been through [`zoho-studio login`](4-login-command.md) with
the `ZohoCRM.settings.static_resources.READ` scope, which is in the default scopes.

## What lands on disk

Files are written under the project root — the folder holding `.zoho-studio/`, not the current
directory.

```text
src/zoho-crm/static-resources/
├── user/
│   └── billingDefault.6640142000053904403/
│       ├── billingDefault.metadata.json
│       └── billingDefault.js
├── crm/
│   └── ZDK-1.0.6640142000000476013/
│       └── …
└── internal/
    └── DotSDK-2.0.6640142000000476015/
        ├── DotSDK-2.0.metadata.json
        └── crm_dot_sdk.js.gzip
```

Every resource Zoho lists is pulled, and the first level splits them by their `source`: `user` for
the files uploaded in this organization, `crm` and `internal` for the libraries Zoho itself ships.
A resource directory is named after the resource and its id; the file inside keeps the
`file_name` Zoho reports.

`*.metadata.json` holds the full resource record exactly as Zoho returned it, formatted with a
four-space indent and a trailing newline. The file is the one behind the resource `uri`, written
byte for byte — Zoho's gzip resources stay gzip. The `uri` lies outside Zoho CRM and is requested
without the OAuth token, the way the CRM web UI requests it.

**The target directory is deleted and recreated on every run.** It always reflects the current pull,
so a resource removed in Zoho disappears locally, and any local edit inside it is lost.

## Failures

A resource whose file cannot be fetched does not stop the run: its metadata is still written, no
file is created, and it is listed in the summary with a short error. Failing to fetch the resource
list itself is fatal, since there would be nothing to write.

## Logs

The CLI writes structured JSON logs to [`logs.file`](2-settings.md), `logs/zoho-studio-cli.log` by
default. `z-crm:static-resources:pull` records the start of the run, how many resources were found,
the final counts, and every failure with its stack trace. Tokens and authorization headers are
never logged.
