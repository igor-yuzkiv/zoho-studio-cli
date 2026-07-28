---
id: artifact-routing
title: Artifact routing
kind: rule
binding: mandatory
description: Where an artifact goes is a property of the project, never of this catalog.
applies_to: [text, code, decisions, client-communication]
use_when:
  - producing anything that has to be stored somewhere — a spec, a decision, a note, an update
---

# Artifact routing

**This catalog decides what an artifact looks like. The project decides where it lives.**

No block, agent, or template names a destination. Destinations come from the project profile, because projects genuinely differ: one has a task board and the spec belongs there, another keeps specs in the repository, a third has neither and the answer is a file next to the code.

## The procedure

1. **Read the profile.** It states the address for each artifact type, plus the project's stack, exemplars, and verification commands.
2. **No entry for this artifact type?** Ask — once — and offer a sensible option rather than an open question. Then **write the answer into the profile** so it is never asked again.
3. **No profile at all?** Say so and ask whether to create one. Do not scatter files in the meantime.

Guessing silently is the failure this rule exists to prevent. A spec that lands in an invented `docs/specs/` folder in a project that keeps specs on its board is not a small annoyance — it is a second, competing source of truth, and it will be found months later.

## Do not impose structure

Do not create directory layouts the project did not ask for. Do not introduce a convention because it is common, tidy, or used elsewhere. A configuration that reorganizes the projects it touches stops being installed.

If the natural home for something does not exist yet, that is a question for the person, not a gap for you to fill.

## The profile is the only place

When an address changes, it changes in the profile. An address repeated inside a block, a template, or an agent prompt is a second copy that will drift — see [[dry]].

## What may be written into it

Two constraints, whenever you add an entry:

- **Nothing sensitive.** No tokens, credentials, internal hostnames, or client data. The profile is read by agents, quoted into outputs, and may sit in a repository other people can read.
- **No absolute paths.** Relative to the project root, or a named reference such as `project-office` or `creative-team:some/path`. An absolute path breaks on every other machine and leaks the local filesystem layout into the project.

Both hold regardless of whether the file is currently committed — that decision can change later, and nobody re-audits the file when it does.
