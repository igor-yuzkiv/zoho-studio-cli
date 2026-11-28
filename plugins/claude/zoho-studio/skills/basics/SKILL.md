---
name: basics
description: Working in a zoho-studio project — a folder with .zoho-studio/ where Zoho CRM is mirrored as local files and changed through the zoho-studio CLI. Use it whenever the session is in such a project, the user mentions zoho-studio or a z-crm:* command, or asks about the project's Zoho CRM — modules, fields, layouts, functions, workflow rules, client scripts, widgets, migrations — before running any zoho-studio command and before answering from memory.
---

# Basics

zoho-studio is a CLI that pulls a Zoho CRM organization into local files and changes a few things in it — functions, modules and fields through migrations — from the project. This skill gives the order of work and when to ask the person. What the CLI does, how to write its files, and how to read what it pulled come from `zoho-studio instructions`, built into the installed CLI and always matching it; this skill does not repeat them.

## Goal

The person's question is answered from the organization's pulled files or the change is made through the CLI, and nothing reached Zoho without their agreement.

## Workflow

1. **Find the project.** It is the nearest folder with `.zoho-studio/` up from the current one. None — offer `zoho-studio init`. The shell does not find `zoho-studio` — ask the person to run `/zoho-studio:setup`.
2. **Read the instructions.** `zoho-studio instructions` once per session; before a kind of work, the text of its group (`zoho-studio instructions z-crm` for reading the pulled files, `… z-crm:functions`, `… z-crm:migrations`, `… z-crm:widgets`); before using a command for the first time, `zoho-studio instructions <command>`. Done when you know which command or file the task needs, or that the CLI has none.
3. **Check the connection.** `zoho-studio z-crm:status` shows which organization the project is logged in to and whether it is a sandbox. "Not authorized" — the person runs `zoho-studio login`; it needs their browser.
4. **Answer from the pulled files.** A question about the organization is answered from `data/`, read as the instructions describe. Pull first when what you need is missing or the person wants the current state; a pull only reads from Zoho.
5. **Change only the project's own files** — sources, migrations, widgets, scripts, as the instructions name them. Files a pull writes are rewritten by the next pull; a change there is lost.
6. **Anything that writes to Zoho** — the instructions mark which commands do — runs only after the person agreed to that run. Tell them the organization and whether it is a sandbox or production first; pass `--yes` or `--force` only with that agreement.
7. **When the CLI cannot do it** — the instructions list what it does not do — say so plainly. Look the answer up in first-hand sources: the skills of this plugin for that part of Zoho CRM, and the Zoho CRM OpenAPI spec that `/zoho-studio:setup` installs (its location is in `${CLAUDE_PLUGIN_ROOT}/references/dependencies.md`).
8. **Read the result by the exit code.** Non-zero is a failure, even when part of the work was done; the details are in the project log the instructions point to.

## Rules

- Do not invent a command, an option, or a file format: if `instructions` and `--help` do not have it, the CLI does not have it.
- Take a fact about the CLI from `instructions`, not from memory or from this skill: the CLI changes between versions, and `instructions` changes with it.
- Do not ask the person for client secrets or tokens in the chat; logging in happens in their terminal.

## Output

The answer with the files or the command output it rests on; for a change — what changed, where, and what still waits for the person's agreement.
