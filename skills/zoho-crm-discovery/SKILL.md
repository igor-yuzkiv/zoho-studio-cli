---
name: zoho-crm-discovery
description: >-
  Work out how a Zoho CRM org actually behaves, from the configuration the zoho-studio
  CLI pulled into a local project — what triggers a piece of automation, what a workflow
  rule, Deluge function, module, field, workflow action, webhook, or picklist is
  connected to, and what breaks if it changes. Use when asked how some CRM behaviour
  works, what fires a function, what uses a module or field, how two parts of the org
  relate, or for a full investigation written up as a document. It reads the pulled
  configuration and never edits it.
allowed-tools: Read, Grep, Glob, Bash, Write, Edit, AskUserQuestion
---

# Zoho CRM discovery

Answer one question about how a Zoho CRM org actually behaves — what runs when, what is wired
to what — from the configuration the `zoho-studio` CLI pulled into `src/`.

The subject is the org's logic and its connections. The files are only where that logic is
recorded, so they are the evidence, never the point.

**Every claim points at a file.** A file you did not open is not evidence, and a plausible
explanation of Zoho behaviour is not a finding. What you could not establish is
reported, not omitted — silence reads as coverage.

`src/` is a mirror. The next pull overwrites it, so editing a file there changes nothing in
the org. Where a project allows new work, its own instructions say where it goes.

## Step 1 — confirm the ground

Read the project's own instructions (`CLAUDE.md`, `AGENTS.md`) before searching. They carry
what this skill cannot know — the org's naming conventions, which prefixes mean what, which
external systems consume its webhooks. `references/artifact-graph.md` carries the layout and
the reference shapes, which are the CLI's contract and the same in every project. When the
two disagree about layout, the files on disk decide.

`src/` reflects the last pull, not the org. Before concluding that something is absent,
check whether it was ever pulled — `logs/zoho-studio-cli.log`, when the project keeps one,
records what ran and what failed.

## Step 2 — pick the depth, and say which

Two depths, one method. Naming the depth out loud is what stops a focused question from
quietly becoming a full sweep.

**Focused** — the default whenever the user asked something answerable. One question, the
shortest path through the graph that answers it, an answer in chat. Nothing the question did
not ask for.

**Full** — only when the user asked to investigate something, rather than asking a question
about it: one artifact, a set of them, or a process spanning several. Everything below runs,
and the result is usually worth a document.

If the request could be either, ask once. Guessing full is the expensive mistake.

## Step 3 — trace

Start at whichever artifact the question names, then follow the references in
`references/artifact-graph.md`. Those edges are exact JSON keys — walk them, do not guess a
connection from a name.

Two traversals answer almost everything:

- **downstream** — what does this artifact reach? Rule → its actions → the function or
  webhook each action binds → what that code touches.
- **upstream** — what reaches this artifact? Given a function or module, search for its
  `api_name` across `src/`. This is the one direction with no index, so it is a search, and
  its completeness is only as good as the patterns you tried.

A function appears under its `api_name`, its display name, and its file name, and these
differ in case and separators — so "unused" means unfound across all three.

**Where the graph ends.** A Deluge function calling another function is plain text in a
`.deluge` file — there is no structured reference. Report such links as found by text search
and say so. The same applies to anything inferred from a naming convention: a prefix is a
hint about intent, never proof of a caller.

## Step 4 — spend context deliberately

A real org is larger than it looks: a module directory can hold a hundred field files, and
`src/modules/` several thousand. The reference keys are few and these files are JSON, so a
grep across many usually beats opening any of them.

When the sweep grows past what fits comfortably, the scope was too wide. Report the boundary
and let the user narrow it.

## Step 5 — report

Lead with the answer, then the evidence, then the limits.

A full investigation covers dimensions a focused answer skips: what triggers it, what it
depends on and what depends on it, the conditions and guards that decide whether it acts, and
what breaks if it changes — especially anything crossing into an external system.

## Step 6 — visualization, when it earns its place

A diagram earns its place when the shape of the answer is the answer — a chain of four or more
hops, a rule fanning into several actions, a web of lookups between modules. When prose says
it in two lines, prose wins.

**Inside a markdown document, just draw it.** Mermaid renders there and stays a text diff, so
a diagram that helps needs no permission.

**An HTML report or map is a deliverable of its own.** Build one when the user asks, or offer
it in one line and build it after they agree. Do not build one unasked for a two-hop answer.

`references/visualizations.md` says which form fits which result, and `templates/` carries the
page so the time goes into the content.

## Step 7 — the document, when one is owed

Only for a full investigation, and only when the user asked for a document or agreed to one.

**Where it goes is the project's decision, never this skill's.** Read
`.claude/composable-pipeline/project-profile.yml` when it exists, then the project's
instructions and the places it already keeps documents. Ask once when it is still unclear.
Do not invent a folder — a document in a location the project did not choose becomes a
second source of truth nobody knows about.

Update an existing document when one covers this artifact; create a new one only when none
does. Follow the naming and format the project's existing documents already use.

**Date the investigation against what it was made from.** Record the commit or the pull the
findings came from. A pull replaces `src/` wholesale, so a document that does not say which
state it describes cannot be checked later.

## Boundary

This skill investigates. Writing Deluge, planning a change, and running the `zoho-studio`
CLI to refresh the mirror are all separate work — if the mirror is stale, say so and let the
user pull.
