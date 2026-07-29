---
id: write-task-spec
title: Write task spec
kind: operation
description: Produce a specification complete enough that someone with none of this context can execute it without deciding anything.
applies_to: [code, text]
use_when:
  - the work will be done in another session, by another person, or by a weaker model
  - a task is being filed now and executed later
skip_when:
  - the work is being done immediately, in this context, by whoever planned it

requires:
  - agreed outcome and boundaries
  - context map with real file paths
  - the decisions the work rests on
produces:
  - a task spec, filed where the profile says task specs go
completion_criteria:
  - every file path in it was verified to exist
  - every choice the executor could face is either decided or listed as must-not-decide
  - acceptance criteria are checkable, and the verification commands are exact
  - an exemplar is named

autonomy:
  depth: high
  decisions: none
escalates:
  - a decision the spec needs has not been made
  - no exemplar exists for the kind of thing being built

applies_rules:
  - reference-over-prose
  - decision-authority
  - evidence-and-claims
  - artifact-routing
---

# Write task spec

## Goal

Write down enough that the work can be executed by someone who was not here — and who therefore cannot ask what you meant.

## The test the spec has to pass

**Is there any point at which the executor would have to choose?**

If yes, that choice is either settled in `Decisions made` or listed in `Must not decide`. There is no third state: **silence is not permission, but the executor will read it as permission anyway.** A weaker model especially — it will decide, confidently, and the decision will be invisible until review.

This single question is what the spec exists for. Everything else is supporting detail.

## What carries the weight

**`Exemplar`.** One line naming a real file that already does something of this shape does more than a page describing conventions, and it does not go stale silently. See [[reference-over-prose]]. If nothing in the codebase does this yet, say so — that is a design decision surfacing, not a gap to fill with prose.

**`Out of scope`.** Empty for anything non-trivial means it was not thought about. This is where an executor's scope creep gets pre-empted.

**`Verification`.** Exact commands from the profile, with the expected result. "Run the tests" is not verification; it is a hope.

## Verify before filing

Every path in the spec gets checked for existence. A spec that references a file which was renamed last week sends the executor into a hunt, and the hunt is where improvisation starts.

## Do not

- Do not describe how to write the code. Describe what must exist and what it must satisfy.
- Do not restate the whole context map. Point at what matters, with `file:line`.
- Do not leave a decision open because it seems small. Small open decisions are exactly the ones that get made silently and wrongly.
