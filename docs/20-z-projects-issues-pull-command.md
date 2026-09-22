# `zoho-studio z-projects:issues:pull`

Downloads the issues of the Zoho Projects project named in the settings — all of them, or those
last updated in a period — together with the comments of each issue, as raw JSON under
`src/zoho-projects/raw/issues/`. Issues have no milestone or task list in Zoho, so unlike tasks
they need no parents and sit in one flat folder.

```bash
zoho-studio z-projects:issues:pull                                   # every issue
zoho-studio z-projects:issues:pull --from=2025-01-01                 # updated since January 1st
zoho-studio z-projects:issues:pull --from=2025-01-01 --to=2025-01-31 # updated in January
```

```text
Issues found: 236
Issues in period: 12
Issues saved: 12
Comments saved: 31
Issues skipped: 0
```

The command needs the same [settings](2-settings.md) and login as
[`z-projects:milestones:pull`](16-z-projects-milestones-pull-command.md), with the
`ZohoProjects.bugs.READ` scope granted — Zoho calls issues "bugs" in its API. A project
authorized before that scope was added has to run `login` again.

## The period

`--from` and `--to` work exactly as in [`z-projects:tasks:pull`](18-z-projects-tasks-pull-command.md#the-period):
dates as `YYYY-MM-DD`, optional, inclusive, UTC. An issue is in the period by its last update
(`last_updated_time`); an issue without that field only passes when no period is given. The whole
issue list is fetched and filtered locally, and the comments are requested only for the issues in
the period, one issue after another, with the same pause and throttle handling as for tasks.

## What you get

```text
src/zoho-projects/raw/
  issues/
    Login timeout/
      100000000000000051.json
      100000000000000051.comments.json
    Broken export/
      100000000000000052.json
      100000000000000052.comments.json
```

`<id>.json` is the issue exactly as Zoho returned it from `issues`, description included — Zoho
sends the description with the list, as HTML, and leaves the field out when it is empty.
`<id>.comments.json` is the list of its comments from `bugs/<id>/comments`, written even when it
is empty (`[]`) so that every issue folder has the same two files. The folder rules are those of
[`raw/`](16-z-projects-milestones-pull-command.md#raw-accumulates): named after the issue, found
again by id on a rerun, the id appended when the name is already taken, nothing deleted.

## When a single issue fails

An issue whose comments cannot be fetched is skipped — neither of its files is written — and
reported at the end; the run continues and the exit code is non-zero:

```text
Issues saved: 11
Issues skipped: 1
  - Login timeout (100000000000000051): Request failed with status code 500
```

A failure of the issue list request itself stops the command before anything is written.
