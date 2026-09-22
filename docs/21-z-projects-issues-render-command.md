# `zoho-studio z-projects:issues:render`

Builds the issues part of the Obsidian vault out of the raw JSON
[`z-projects:issues:pull`](20-z-projects-issues-pull-command.md) left in
`src/zoho-projects/raw/issues/`: one markdown file per issue, grouped by status, and one index —
all under `issues/` inside the catalogue folder of
[`z-projects:tasks:render`](19-z-projects-tasks-render-command.md), that is `src/zoho-projects/md/`
or the folder `projects.mdPath` in the [settings](2-settings.md) names. It reads the disk only —
no request goes to Zoho.

```bash
zoho-studio z-projects:issues:render
```

```text
Catalogue written to: /home/me/vault/zoho
Issues rendered: 236
Comments rendered: 512
Raw files skipped: 0
```

The command needs `projects.portalId` and `projects.projectId` in the settings — they go into the
"Open in Zoho" links. An empty `raw/issues/` ends the command with a note and touches nothing.
The raw tasks, when they are there, are read too, so that an issue can link the tasks it mentions;
they are not rendered by this command.

## What you get

```text
src/zoho-projects/md/
  issues/
    Issues.md                         index: one row per issue
    open/
      51-login-timeout.md             one file per issue, <number from the prefix>-<slug>.md
    closed/
      52-broken-export.md
```

Issues have no milestone or task list, so there is no tree: the status is the only folder, named
by the same slug rules as the task catalogue. Every run overwrites the files of what is in
`raw/issues/` and leaves everything else alone; the one thing removed is the previous copy of an
issue whose status changed. An issue deleted in Zoho stays until you remove its file yourself.
`rendered_at` and the counters in the index change on every run.

## The issue file

Frontmatter (`type: issue, id, prefix, name, url, status, is_closed, severity, classification,
reproducible, module, flag, assignee, created_by, created_time, last_updated_time,
completed_time, due_date, tags, comments_count, related_issues, related_tasks`), then:

- `# <prefix>: <name>` and the `[Open in Zoho](…)` link, `…#zp/projects/<projectId>/bug-detail/<id>`;
- `## Description` — the Zoho description as markdown, `_(empty)_` when there is none;
- `## Cross links` — every issue (`SS5-I12`, `bug-detail/<id>`) and every task (`SS5-T580`,
  `task-detail/<id>`) mentioned in the description or the comments: `[[file]] — SS5-I12 Name (Status)`
  when it is in `raw/`, `SS5-I12 — not pulled` when it is not; `_(none)_` when nothing is mentioned.
  Task files do not link back to issues;
- `## Comments` — newest first, in the same form as task comments.

An unassigned issue has `assignee: null` — Zoho fills the field with a placeholder person, and the
catalogue drops it. Descriptions and comments go through the same
[HTML to markdown](19-z-projects-tasks-render-command.md#html-to-markdown) conversion as tasks.

## The index

`issues/Issues.md` carries `type: issues-index, project_id, project, issues_rendered, issues_open,
issues_closed, rendered_at` and a table `| Issue | Status | Severity | Assignee | Created |`, one
row per issue as `[[file|SS5-I12 Name]]`, open statuses first, then by issue number.

## Failures

A `raw/issues/` file that is not valid JSON is skipped and listed at the end; the rest is rendered
and the exit code is non-zero. An empty `portalId` or `projectId` stops the command before it
reads anything.
