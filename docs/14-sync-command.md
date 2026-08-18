# `zoho-studio sync`

Runs several pull commands in one go, in the order the project settings list them.

```bash
zoho-studio sync
```

```text

[1/4] modules:pull
Modules found: 42
Metadata saved: 42

[2/4] fields:pull
Pulling fields |████████████████| 42/42 | Vendors
Modules processed: 42
Fields saved: 1187
Modules failed: 0

[3/4] functions:pull
...

[4/4] workflows:pull
...

Steps completed: 4
```

Each step is the ordinary command, run exactly as if you had typed it yourself — same output, same
files on disk, same log lines. `sync` adds the order and the numbered headings, nothing else. It
takes no options of its own; a step that needs one is run by hand instead.

## What it runs

The list is [`sync.commands`](2-settings.md) in `.zoho-studio/settings.json`, and its default is:

```json
"sync": { "commands": ["modules:pull", "fields:pull", "functions:pull", "workflows:pull"] }
```

**The order matters.** `fields:pull` reads the modules that `modules:pull` wrote, and
`modules:pull` deletes `src/modules/` before rewriting it — so fields pulled before modules are
thrown away by the next step.

Put your own list in the settings file and it replaces the default entirely — nothing is merged in
behind it. A list you shorten stays short, and an empty list means nothing runs:

```text
sync.commands is empty — nothing to run.
```

Only command names go in the list, without arguments. Any command the CLI registers is allowed, not
just the pull ones.

## Failures

**The whole list is checked before the first request goes out.** A name the CLI does not know, or
`sync` listed inside itself, fails immediately and runs no step at all:

```text
sync.commands names an unknown command: "modules:pul".
```

**The first failed step stops the run.** Later steps read what earlier ones wrote, so continuing
past a failure would build on a snapshot that is not there. The message names the step, the numbered
headings above it show how far the run got, and the exit code is non-zero:

```text
Sync stopped at "fields:pull": Request failed with status code 401
```

A step that handles its own per-item failures — `fields:pull` reporting `Modules failed: 2`, for
instance — has not failed as a step, and the run continues.

## Logs

The CLI writes structured JSON logs to [`logs.file`](2-settings.md), `logs/zoho-studio-cli.log` by
default. `sync` records the list it is about to run and the number of steps completed; each step
logs its own run as usual, under its own command name.
