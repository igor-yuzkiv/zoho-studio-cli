# Overview

Zoho Studio CLI is a command-line tool for working with Zoho platform resources as local files, so
Zoho development fits normal software engineering workflows — version control, scripts, and
agent-driven automation.

A **project** is any folder containing `.zoho-studio/settings.json`. That single file holds
everything the CLI needs: which Zoho account to talk to, which API to call, and the credentials to
do it with. `zoho-studio init` scaffolds the project around it.

Everything the CLI downloads lands under `src/`, in a folder per Zoho product, at paths it fixes
and no setting moves — `src/zoho-crm/functions`, `src/zoho-crm/modules`, `src/zoho-crm/workflows`,
`src/zoho-crm/workflow-actions`, and `src/zoho-projects/raw/` for the raw Zoho Projects tree:

```text
src/zoho-projects/raw/
  <milestone>/
    <milestone-id>.json
    task-lists/<task-list>/
      <task-list-id>.json
      tasks/<task>/
        <task-id>.json
        <task-id>.comments.json
```

A project pulled before the CRM artifacts moved under `src/zoho-crm/` still has the old
`src/functions`, `src/modules` and similar folders. The CLI neither moves nor deletes them: run the
`z-crm:*:pull` commands again and remove the old folders yourself.

## Running the CLI

The CLI runs from source:

```bash
bun install
bun run dev -- --help
bun run dev -- init my-project
```

`bun run build` produces a bundle in `dist/`, and `bun run compile` a standalone executable. Both
are invoked as `zoho-studio`, which is the name used throughout these documents.

## Documents

- [2-settings.md](2-settings.md) — the settings file, and how the CLI reads and writes it
- [3-init-command.md](3-init-command.md) — scaffolding a project with `zoho-studio init`
- [4-login-command.md](4-login-command.md) — authorizing a project with `zoho-studio login`
- [5-status-command.md](5-status-command.md) — checking the connection with `zoho-studio z-crm:status`
- [6-functions-pull-command.md](6-functions-pull-command.md) — downloading functions with `zoho-studio z-crm:functions:pull`
- [7-modules-pull-command.md](7-modules-pull-command.md) — downloading module metadata with `zoho-studio z-crm:modules:pull`
- [8-fields-pull-command.md](8-fields-pull-command.md) — downloading module fields with `zoho-studio z-crm:fields:pull`
- [9-workflows-pull-command.md](9-workflows-pull-command.md) — downloading workflow rules with `zoho-studio z-crm:workflows:pull`
- [10-org-info-command.md](10-org-info-command.md) — reading and storing the organization with `zoho-studio z-crm:org:info`
- [11-workflow-actions-pull-command.md](11-workflow-actions-pull-command.md) — downloading workflow actions with `zoho-studio z-crm:workflow-actions:pull`
- [12-webhooks-pull-command.md](12-webhooks-pull-command.md) — downloading webhooks with `zoho-studio z-crm:webhooks:pull`
- [13-global-picklists-pull-command.md](13-global-picklists-pull-command.md) — downloading global picklists with `zoho-studio z-crm:global-picklists:pull`
- [16-z-projects-milestones-pull-command.md](16-z-projects-milestones-pull-command.md) — downloading Zoho Projects milestones as raw JSON with `zoho-studio z-projects:milestones:pull`
- [17-z-projects-task-lists-pull-command.md](17-z-projects-task-lists-pull-command.md) — downloading Zoho Projects task lists under their milestones with `zoho-studio z-projects:task-lists:pull`
- [18-z-projects-tasks-pull-command.md](18-z-projects-tasks-pull-command.md) — downloading Zoho Projects tasks by period, with their comments, with `zoho-studio z-projects:tasks:pull`
- [19-z-projects-tasks-render-command.md](19-z-projects-tasks-render-command.md) — building an Obsidian markdown catalogue from the raw Zoho Projects JSON with `zoho-studio z-projects:tasks:render`
- [20-z-projects-issues-pull-command.md](20-z-projects-issues-pull-command.md) — downloading Zoho Projects issues by period, with their comments, with `zoho-studio z-projects:issues:pull`
- [21-z-projects-issues-render-command.md](21-z-projects-issues-render-command.md) — building the issues part of the Obsidian catalogue from the raw Zoho Projects JSON with `zoho-studio z-projects:issues:render`
- [15-skills.md](15-skills.md) — agent-facing skills shipped with the CLI, and installing them
