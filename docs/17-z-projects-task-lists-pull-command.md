# `zoho-studio z-projects:task-lists:pull`

Downloads every task list of the Zoho Projects project named in the settings and stores each one
as raw JSON inside the folder of its milestone.

```bash
zoho-studio z-projects:task-lists:pull
```

```text
Task lists found: 54
Task lists saved: 54
Task lists skipped: 0
```

The command needs the same [settings](2-settings.md) and login as
[`z-projects:milestones:pull`](16-z-projects-milestones-pull-command.md), with the
`ZohoProjects.tasklists.READ` scope granted.

## What you get

```text
src/zoho-projects/raw/
  Discovery/
    100000000000000011.json
    task-lists/
      Research/
        100000000000000021.json
  _no-milestone/
    task-lists/
      General/
        100000000000000023.json
```

Each file is one task list exactly as Zoho returned it from `tasklists`. The folder rules are those
of [`raw/`](16-z-projects-milestones-pull-command.md#raw-accumulates): named after the task list,
found again by id on a rerun, the id appended when the name is already taken, nothing deleted.

A task list that belongs to no milestone — Zoho shows it under "None" — goes under the fixed folder
`_no-milestone/`. The underscore keeps it apart from any milestone name.

## Milestones are filled in

A task list needs its milestone folder. When an earlier pull already wrote it, it is found by id;
otherwise the command fetches the milestone list once and writes the missing milestone the same
way `z-projects:milestones:pull` would. You do not have to run that command first.

A task list whose milestone Zoho does not return is skipped and reported at the end, the run
continues, and the exit code is non-zero:

```text
Task lists saved: 53
Task lists skipped: 1
  - Orphan (100000000000000024): Milestone "100000000000000099" is not in the project.
```

A failure of the list request itself stops the command before anything is written.
