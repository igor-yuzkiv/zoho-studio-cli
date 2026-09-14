# `zoho-studio z-projects:milestones:pull`

Downloads every milestone of the Zoho Projects project named in the settings and stores each one
as raw JSON under `src/zoho-projects/raw/`, one folder per milestone.

```bash
zoho-studio z-projects:milestones:pull
```

```text
Milestones found: 5
Milestones saved: 5
```

The command needs `projects.portalId` and `projects.projectId` in the [settings](2-settings.md) and
a project that has been through [`zoho-studio login`](4-login-command.md) with the
`ZohoProjects.milestones.READ` scope. An empty id stops the command with the name of the field
before any request; a project authorized before the `ZohoProjects.*` scopes existed has to log in
again.

## What you get

```text
src/zoho-projects/raw/
  Discovery/
    100000000000000011.json
  Delivery/
    100000000000000012.json
```

Each file is one milestone exactly as Zoho returned it from `phases`. The folder is named after
the milestone; a second milestone with the same name gets the id appended (`Discovery.<id>`), so
the two never share a folder.

## `raw/` accumulates

Unlike the CRM folders, `raw/` is never emptied. Every `z-projects:*:pull` writes or overwrites the
files of its own level and deletes nothing, because tasks are pulled by period and a wipe would
throw away the periods pulled earlier. A rerun finds a milestone's folder by the id inside it, so a
milestone renamed in Zoho is updated in place; a milestone deleted in Zoho stays on disk. To start
clean, delete `src/zoho-projects/raw/` yourself and pull again.

The task lists inside each milestone come from
[`z-projects:task-lists:pull`](17-z-projects-task-lists-pull-command.md), the tasks from
[`z-projects:tasks:pull`](18-z-projects-tasks-pull-command.md).
