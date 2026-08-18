---
paths:
  - "skills/**"
---

# Rule: Skills

`skills/` holds agent-facing skills this repository ships. They are prompt, not code.

A skill here is not about running the CLI. It is about working with what the CLI produced —
the Zoho artifacts sitting in a pulled project. So a skill runs in **another** repository:
the mirror, not this one. Nothing in a skill may assume this repository's files, paths, or
tooling are present where it runs.

## Structure

One folder per skill, named as the skill is: `skills/<skill-name>/SKILL.md`, plus
`references/` for material the skill loads only when it needs it.

`SKILL.md` is read every time the skill fires, so it carries the method and nothing else.
Anything long, tabular, or consulted occasionally — a layout table, a set of conventions —
belongs in `references/`.

Keep the family focused. A skill answers one kind of request; a second kind is a second
skill, not another section.

Prefer stating what an output has to hold to over shipping a file to fill in. A template fixes
the shape of an answer before the question is known, and situations differ more than a template
can.

## What a skill may state as fact

The CLI's contract — the fixed `src/` layout, file naming, the shape of what it writes —
because this repository owns it and changes it. When that contract changes, the skills that
restate it change in the same commit.

Everything else belongs to the project the skill runs in, and the skill reads it there rather
than carrying a copy: org conventions, naming prefixes, external systems, and where documents
go. A destination hardcoded into a skill is a second source of truth in every project that
installs it.

## Verification

The development validators do not apply. `bun run lint`, `bun run typecheck`, and `bun test`
prove nothing about a prompt, and passing them is not evidence a skill change is good.

What replaces them is reading the skill against the change's own acceptance criteria: is the
wording unambiguous, are the boundaries explicit, does it stay compact, does it duplicate
what the project it runs in already says, and does it contradict none of the existing flows.
A prompt-engineering lens is the useful one.

## Installing

A skill reaches Claude Code only after `bun run deploy-skills`, which copies every folder
under `skills/` to `~/.claude/skills/`. Editing a file here changes nothing in a running
session until that runs.
