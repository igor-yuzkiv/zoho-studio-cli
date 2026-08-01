# `zoho-studio workflows:pull`

Downloads every Zoho CRM workflow rule into a flat `src/workflows/` folder — one JSON file per rule,
including the conditions and actions that the rule list alone does not carry.

```bash
zoho-studio workflows:pull
```

```text
Pulling workflow rules |████████████████████| 77/77 | Send Welcome Email
Workflow rules found: 77
Workflow rules saved: 77
Workflow rules failed: 0
```

The command needs a project that has been through [`zoho-studio login`](4-login-command.md), with
the `ZohoCRM.settings.workflow_rules.READ` scope granted. It does not depend on any other pull
command: the rules come from the API, and they are written to their own folder, so
[`modules:pull`](7-modules-pull-command.md) neither feeds it nor overwrites it.

Rules are fetched one at a time — a list request, then one request per rule for its full record —
with a short delay between them to stay clear of Zoho's API limits. An organization with a hundred
rules takes about a minute. The progress bar shows the rule currently being pulled.

## What lands on disk

```text
src/workflows/
├── Big Deal Rule.json
├── Contacts.Server.Upsert.json
└── Send Welcome Email.json
```

Each file holds the full rule record as `GET /settings/automation/workflow_rules/{id}` returned it,
formatted with a four-space indent and a trailing newline. That record includes `conditions` — the
criteria, the instant actions, and the scheduled actions — which is what makes the snapshot worth
reading. The actions themselves appear as references (name, id, type); their own bodies live behind
separate endpoints and are not pulled.

The folder is always `src/workflows/`; no setting moves it.

**The whole folder is deleted and recreated on each full run**, so a rule removed in Zoho disappears
locally and any local edit is lost.

Files are named after the rule. Only characters a path segment cannot contain are replaced; nothing
else about the name is changed. Rule names are not unique, so when two rules would claim the same
file name the second one carries its rule id as well — `Move Files.1000000000000012345.json`. Rules
are processed in a fixed order, so a full run always names them the same way. Which of two duplicates
gets the plain name can still change if the folder was built by `--module` runs and is then rebuilt
by a full one — both rules are kept either way, but the pair shows up as a rename.

## One module at a time

`--module` narrows the run to the rules of a single module:

```bash
zoho-studio workflows:pull --module=Deals
```

This run does **not** wipe the folder. It removes only the files whose rule belongs to that module —
each file records its own module, so the owner is read back out of the file — and leaves every other
rule where it is. A file that cannot be read as a rule is left alone rather than guessed about.

The value is a module API name. A value that is not a plain name is refused before anything is
deleted, and a module Zoho does not know stops the command with Zoho's own message.

## Failures

A rule whose full record cannot be fetched does not stop the run: it is listed in the summary with
a short error, the remaining rules are still pulled, and the command still succeeds.

```text
Workflow rules failed: 1
  - Big Deal Rule: The value provided to the param is Invalid (INVALID_MODULE)
```

Failing to fetch the rule *list* is fatal — there is nothing to write.

## Logs

The CLI writes structured JSON logs to [`logs.file`](2-settings.md), `logs/zoho-studio-cli.log` by
default. `workflows:pull` records the start of the run, how many rules were found, the final counts,
and every failure with its stack trace. Individual successful rules are not logged — the progress
bar already shows them.
