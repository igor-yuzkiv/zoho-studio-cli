# `zoho-studio functions:pull`

Downloads every Zoho CRM function of the project into `src/functions/` — one directory
per function, holding its metadata and its Deluge source.

```bash
zoho-studio functions:pull
```

```text
Pulling functions |████████████████████| 77/77 | wf_leads_generatePublicLink
Functions found: 77
Metadata saved: 77
Code downloaded: 76
Code failed: 1
  - Send Invoice (send_invoice): Request failed with status code 500
```

The command needs a project that has been through [`zoho-studio login`](4-login-command.md).

## What lands on disk

Files are written under the project root — the folder holding `.zoho-studio/`, not the current
directory.

```text
src/functions/
└── calculate_invoice_total/
    ├── Calculate Invoice Total.metadata.json
    └── Calculate Invoice Total.deluge
```

The directory is named after the function's API name, the files after its display name. Only
characters a path segment cannot contain are replaced; nothing else about the name is changed.

`*.metadata.json` holds the full function record exactly as the list endpoint returned it,
formatted with a four-space indent and a trailing newline. `*.deluge` holds the source verbatim —
it is never formatted, wrapped, or parsed.

**The target directory is deleted and recreated on every run.** It always reflects the current pull,
so a function removed in Zoho disappears locally, and any local edit inside it is lost.

The location is fixed: `src/functions/` under the project root, created if it is not there. No
setting moves it — see [`zoho-studio init`](3-init-command.md) for the project tree.

## Failures

A function whose code cannot be fetched does not stop the run: its metadata is still written, no
code file is created, and it is listed in the summary with a short error. The command still
succeeds — partial code failures are reported, not fatal.

Failing to fetch the function list itself is fatal, since there would be nothing to write.

Requests for the code run one at a time with a short delay between them to stay clear of Zoho's
API limits, so a large project takes a while.

## Logs

The CLI writes structured JSON logs to [`logs.file`](2-settings.md), `logs/zoho-studio-cli.log` by
default, created on the first line written — a command that logs nothing leaves no file behind. `functions:pull` records the start of the run, how many functions were found,
the final counts, and every failure with its stack trace. Individual successful functions are not
logged — the progress bar already shows them.

The terminal keeps the progress bar, the summary, and short error messages; the detail stays in the
log file. Tokens and authorization headers are never logged.
