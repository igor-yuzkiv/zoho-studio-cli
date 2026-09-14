# `zoho-studio z-projects:tasks:render`

Builds an Obsidian vault out of the raw Zoho Projects JSON the pull commands left in
`src/zoho-projects/raw/`: one markdown file per task, an index per milestone and per task list,
all under `src/zoho-projects/md/` — or under the folder `projects.mdPath` in the
[settings](2-settings.md) names, absolute or relative to the workspace root, when you want the
catalogue straight inside an Obsidian vault. It reads the disk only — no request goes to Zoho.

```bash
zoho-studio z-projects:tasks:render
```

```text
Milestones rendered: 5
Task lists rendered: 54
Tasks rendered: 412
Comments rendered: 1180
Raw files skipped: 0
```

The command needs `projects.portalId` and `projects.projectId` in the [settings](2-settings.md) —
they go into the "Open in Zoho" links — and a `raw/` filled by
[`z-projects:milestones:pull`](16-z-projects-milestones-pull-command.md),
[`z-projects:task-lists:pull`](17-z-projects-task-lists-pull-command.md) and
[`z-projects:tasks:pull`](18-z-projects-tasks-pull-command.md). An empty `raw/` ends the command
with a note and touches nothing.

## What you get

```text
src/zoho-projects/md/
  pilot/
    Pilot.md                                      milestone index
    phase-22-technical-maintenance/
      Phase 22 - Technical Maintenance.md         task list index
      backlog/
        580-upgrade-mongodb-package.md            one file per task
      closed/
        697-route-shift-windows-not-populating.md
  none/                                           Zoho's "None" milestone, like any other
  _no-milestone/                                  tasks whose JSON names no milestone
```

Folders are slugs: lower case, anything but letters and digits collapsed to a dash, at most 80
characters; the fixed `_no-milestone` and `_no-task-list` folders keep their name, and a name with
no letters or digits at all is replaced by the entity id. A task file is `<number from the prefix>-<slug of the name>.md`, so `SS5-T580` becomes
`580-…`. An index is named after the display name of its milestone or task list — `:`, `|`, `/`, `\`,
`[`, `]` replaced by ` -`, spaces collapsed, nothing cut — because the wikilinks point at it.

The catalogue folder is derived and rebuilt from scratch on every run — whatever else is in it is
deleted, so give it a folder of its own; the workspace itself, its parents and `.zoho-studio` are
refused. A task whose status changed in Zoho moves
to its new status folder and the old file disappears. Do not edit the files by hand; edit
`raw/` sources by pulling again. Two fields change on every run even when nothing else did —
`rendered_at` and the task counters in the indexes — so expect that noise if `md/` is in git.

## The task file

Frontmatter (`type, id, prefix, name, url, status, is_closed, priority, task_type, milestone,
milestone_id, tasklist, tasklist_id, owners, created_by, created_time, last_modified_time,
start_date, end_date, completed_on, completion_percentage, tags, logged_hours, has_comments,
has_subtasks, comments_count, related_tasks`), then:

- `# <prefix>: <name>`, the `[Open in Zoho](…)` link, and `Tasklist: [[…]] · Milestone: [[…]]`;
- `## Description` — the Zoho description as markdown, `_(empty)_` when there is none;
- `## Cross task links` — the tasks from `dependency_info` (`[[file]] — SS5-T606 (predecessor)`),
  then every task mentioned by prefix in the description or the comments
  (`[[file]] — SS5-T595 Name (Status)`); a mentioned task that is not in `raw/` shows as
  `SS5-T440 — not pulled`; `_(none)_` when there is nothing;
- `## Comments` — newest first, each `### <YYYY-MM-DD HH:MM UTC> — <author>[ (client)]` with the
  body in a ```` ```markdown ```` fence; `_(no comments)_` when there are none.

Where the same task exists in two `raw/` folders — `raw/` accumulates, a rename or a move leaves
the old folder behind — the copy with the later `last_modified_time` is the one rendered.

## HTML to markdown

Zoho stores descriptions and comments as HTML. They are converted with these rules:

| HTML | Markdown |
|---|---|
| `<br>` | hard line break (two spaces + newline) |
| `&nbsp;`, `&amp;amp;` and other entities | decoded, twice over if Zoho encoded them twice |
| `<b>`, `<strong>` | `**…**` |
| `<code>` / `<pre>` | `` `…` `` / a fenced block |
| `<img src>` | `![](src)` |
| `<a href>` | `[text](href)` |
| bare URL in text | `<https://…>`; URLs inside code are left alone |
| `zp[@zpuser#<id>#<Name>]zp` | `@Name` |
| `<h1>`…`<h6>` | demoted two levels (`###`…`######`), so they stay under the file's own sections |
| `<ul>`/`<ol>` | `- item` |

Break-only lines and empty list items that Zoho's editor leaves behind are dropped.

## Failures

A `raw/` file that is not valid JSON is skipped and listed at the end; the rest is rendered and
the exit code is non-zero. An empty `portalId` or `projectId` stops the command before it reads
anything.
