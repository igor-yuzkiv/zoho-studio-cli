# `zoho-studio z-projects:tasks:pull`

Downloads the tasks of the Zoho Projects project named in the settings — all of them, or those
last modified in a period — together with the comments of each task, as raw JSON inside the folder
of the task's task list.

```bash
zoho-studio z-projects:tasks:pull                                  # every task
zoho-studio z-projects:tasks:pull --from=2025-01-01                # modified since January 1st
zoho-studio z-projects:tasks:pull --from=2025-01-01 --to=2025-01-31  # modified in January
zoho-studio z-projects:tasks:pull --to=2024-12-31                  # not touched since 2024
```

```text
Tasks found: 412
Tasks in period: 37
Tasks saved: 37
Comments saved: 118
Tasks skipped: 0
```

The command needs the same [settings](2-settings.md) and login as
[`z-projects:milestones:pull`](16-z-projects-milestones-pull-command.md), with the
`ZohoProjects.tasks.READ` scope granted.

## The period

`--from` and `--to` are dates as `YYYY-MM-DD`, both optional, both inclusive, in UTC: `--from`
starts at the beginning of its day, `--to` ends at the end of its day. A task is in the period by
its last modification (`last_modified_time`), not by its creation, because "what changed" is the
question a re-pull answers. Without options every task is pulled. A `--from` later than `--to`, or
a date in another format, stops the command before any request.

The whole task list is fetched and filtered locally; the comments are requested only for the tasks
in the period, one task after another — Zoho limits the request rate, and comments are one request
per task.

## What you get

```text
src/zoho-projects/raw/
  Discovery/
    100000000000000011.json
    task-lists/
      Research/
        100000000000000021.json
        tasks/
          Interview the owner/
            100000000000000031.json
            100000000000000031.comments.json
      _no-task-list/
        tasks/
          Loose end/
            100000000000000033.json
            100000000000000033.comments.json
```

`<id>.json` is the task exactly as Zoho returned it from `tasks`; `<id>.comments.json` is the list
of its comments from `tasks/<id>/comments`, written even when it is empty (`[]`) so that every task
folder has the same two files. The folder rules are those of
[`raw/`](16-z-projects-milestones-pull-command.md#raw-accumulates): named after the task, found
again by id on a rerun, the id appended when the name is already taken, nothing deleted — so two
runs over different periods add up.

A task without a task list goes under the fixed folder `_no-task-list/` of its milestone.

## Parents are filled in

A task needs the folders of its task list and milestone. When earlier pulls wrote them, they are
found by id; otherwise the command fetches the task list and milestone lists once each and writes
the missing parents the way [`z-projects:task-lists:pull`](17-z-projects-task-lists-pull-command.md)
would. Only the parents of tasks in the period are written, so a narrow period creates no empty
folders — the full milestone and task list structure comes from their own commands.

## When a single task fails

A task whose comments cannot be fetched, or whose task list or milestone Zoho does not return, is
skipped — neither of its files is written — and reported at the end; the run continues and the
exit code is non-zero:

```text
Tasks saved: 36
Tasks skipped: 1
  - Interview the owner (100000000000000031): Request failed with status code 500
```

A failure of the task list request itself stops the command before anything is written.
