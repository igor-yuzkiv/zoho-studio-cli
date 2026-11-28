---
name: pull
description: Pulls a zoho-studio project's Zoho CRM data and writes a readable report of what changed in the organization — added, changed and removed modules, fields, functions, workflow rules and the rest — into changes/zoho-crm/, then offers to commit both. Use when the person asks to pull, refresh or sync from Zoho, or asks what changed in the CRM since the last pull.
---

# Pull

Refreshes the pulled files of a zoho-studio project and tells the person what changed in the organization, in a report kept next to the code. Which pulls exist and how to read the pulled files come from `zoho-studio instructions` (`zoho-studio instructions z-crm` for reading them); the work order of a project is in `/zoho-studio:basics`.

## Goal

The pulled files are current, and a report in `changes/zoho-crm/` names every change the pull brought — or the person heard that nothing changed.

## Workflow

1. **Check git.** The report is built from git, so the project has to be a repository with at least one commit. It is not — offer `git init` and a first commit of the project as it is; without that, stop.
2. **Check the pulled files are committed.** `git status --porcelain -- data/` lists uncommitted changes in the pulled files. If there are any, say so and ask: commit them first, or go on and have them mixed into this report. Changes outside `data/` do not matter here.
3. **Ask what to pull**, unless the person already said ("the fields of Leads"). Offer a preset by default: `zoho-studio preset` lists the project's presets, and the built-in one pulls the whole CRM. The person may pick another preset or one part; the separate pulls are in `zoho-studio instructions z-crm`.
4. **Pull.** Run the chosen preset or command. Exit code 1 means some items failed: go on with the report and list the failures in it. Keep the line `Moved N removed files to data/.removed/<date-time>/` if the pull printed one.
5. **Find what changed.** `git status --porcelain -- data/` for added, changed and deleted files, `git diff -- data/` for what changed inside them. A deleted file was moved by the pull into the folder that line names. Nothing changed — tell the person that nothing changed and stop: no report.
6. **Write the report** `changes/zoho-crm/<YYYY-MM-DD-HHMM>-pull.md`, local time, in the language you speak with the person:
   - a summary of two or three sentences: what was pulled and the main changes;
   - **Added**, **Changed**, **Removed** — by entity (a module, a field, a function, a workflow rule…), each with what it means: a new field and its type, a changed condition of a rule, an edit in a function's code, a removed webhook with the path of its file in `data/.removed/`;
   - **Not pulled** — the items that failed, with the reason the pull gave.

   No raw diff: git keeps it.
7. **Offer the commit** of `data/` and the report together, with a message such as `chore(data): pull zoho-crm, <the main changes>`. Commit only when the person says so.

## Rules

- Read a change from the files before naming it: a field's type, a rule's condition, a function's code — not from the file name alone.
- Describe what changed in the organization, not what changed in the files: "the Stage picklist got the value Lost", not "Stage.json changed".
- Leave `data/` as the pull wrote it: the report describes it, never edits it.

## Output

- The path to the report, or "nothing changed".
- The failed items, if any.
- The proposed commit, waiting for the person's word.
