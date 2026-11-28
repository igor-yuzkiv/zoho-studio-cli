---
paths:
  - "apps/cli/src/**"
  - "packages/**"
  - "template/**"
  - "docs/**/reference/**"
---

# Rule: Agent instructions

`zoho-studio instructions` is what an agent in a user's project knows about the CLI. The texts live
in `apps/cli/src/commands/instructions/texts/` and are built into the executable, so they always
match the code that prints them. That is their whole point: keep them true.

## What belongs there

Everything an agent needs that depends on this CLI's code and changes with it:

- what a command is for, when to use it, whether it writes to Zoho, needs a login or a terminal,
  and what it changes on disk;
- how to write the files the CLI reads — migrations, `.deploy.json`, widget scenarios and tests —
  with the formats, the options, and the checks they go through;
- how to read what the CLI writes — the layout of `data/`, what refers to what;
- how Zoho behaves where our code depends on it (from `zoho-findings/`): what Zoho rejects, what it
  changes, which errors mean what;
- what the CLI does not do, so an agent does not invent a command.

What does not belong there: the options of a command (they are in `--help`), the process of working
with the person (skills), and knowledge about Zoho that our code does not touch — the Deluge
language, the REST API, COQL — and maps of Zoho's documentation (skills of the plugin).

## Layout

The folder mirrors command names: `texts/z-crm/functions/pull.md` for `z-crm:functions:pull`,
`texts/z-crm/functions.md` for the group, `texts/overview.md` for the whole CLI. A group gets a text
when there is something to say beyond the list of its commands. Every text is listed in
`instructions.texts.ts`; `tests/cli/commands/instructions.texts.spec.ts` fails when a command has no
text or a text has no command.

Texts are written in English, for an agent: the facts it acts on, with examples of files it will
write; no marketing, no history.

## When to update

In the same change as the code:

- a new command — its text, and its line in the group and overview texts where they name commands;
- a changed command, option default, file format, check, or error — every text that describes it
  (search the folder for the command name, the file name, and the error code);
- a new finding in `zoho-findings/` that changes what an agent should do — the text of the command
  it affects;
- a new limitation or a lifted one — "What the CLI does not do" in `overview.md`.

A text describes shipped behavior only, like the documentation. Before a release, `/release`
checks the texts against the changes since the last tag.
