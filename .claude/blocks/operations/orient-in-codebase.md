---
id: orient-in-codebase
title: Orient in codebase
kind: operation
description: Return a compressed map of the code relevant to one narrow question.
applies_to: [code]
use_when:
  - the change touches code you have not established the shape of
skip_when:
  - the relevant files and their behaviour are already established in this session
  - the question is "what shape should this code take" — read the exemplar directly instead; a map is the wrong output for that

requires:
  - a narrow scope question — one area, one flow, one concern
produces:
  - context map — entry points, components, execution flow, business rules, existing patterns, tests, risks, unknowns
completion_criteria:
  - every claim carries a file:line that was actually opened
  - what could not be determined is listed rather than omitted
  - the map answers the scope question and does not wander past it

autonomy:
  depth: high
  decisions: none
escalates:
  - the scope question turns out to span areas that should be separate runs

applies_rules:
  - output-discipline
  - evidence-and-claims
---

# Orient in codebase

## Goal

Answer one narrow question about the codebase with a map compact enough to reason from.

This operation does not propose implementations and does not change code. Its entire value is that reading forty files happens somewhere other than the main context.

**It is not how the caller gets an exemplar.** If the question is what shape the new code should take, the answer is the exemplar's text, and a compressed map cannot carry it — the caller should open that file directly rather than send you for a summary of it.

## Scope narrowly, run several

One agent told to "understand the project" returns a shallow survey of everything and a confident tone. Several agents with narrow scopes, running at once, return usable maps:

```text
orient: how payroll recalculation is triggered today
orient: where contractor portal reads tariff data
orient: existing export generation and its file format
orient: tests and fixtures covering tariffs
```

Reads never conflict, so this parallelizes freely — see the decomposition step for when the same is true of writes.

## Steps

1. Find the entry points for the scope — routes, commands, jobs, events, UI actions.
2. Follow the flow far enough to answer the question, and no further.
3. Note business rules as you meet them: conditions, guards, special cases.
4. Find the existing pattern for this kind of work — the file a similar change would follow.
5. Find the tests that cover the area.
6. Record what you could not determine.

## Output

```yaml
entry_points: []       # file:line — what starts this flow
components: []         # file — role in one line
execution_flow: []     # ordered steps, each with file:line
business_rules: []     # rule — file:line where it is enforced
existing_patterns: []  # file:line — the analogue a change here should follow
tests: []              # file — what it covers
risks: []              # what a change here could break, with evidence
unknowns: []           # what you could not establish, and what would settle it
```

Point, do not quote. The caller can open any of these; they cannot reclaim the context you spent pasting them.
