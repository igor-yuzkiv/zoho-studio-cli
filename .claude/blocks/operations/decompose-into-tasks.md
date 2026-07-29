---
id: decompose-into-tasks
title: Decompose into tasks
kind: operation
description: Turn an agreed solution into separately schedulable units of work, each independently verifiable.
applies_to: [decisions, code]
use_when:
  - a solution has been decided and the work is larger than one sitting
  - work will be executed later, or by someone other than whoever planned it
skip_when:
  - the whole thing is one task

requires:
  - a decided solution — not a set of options
  - the decisions it rests on, recorded
produces:
  - tasks, each with an outcome, boundaries, dependencies, and acceptance criteria
  - the order they can be done in, and what can run in parallel
completion_criteria:
  - each task can be verified without waiting for the others
  - no piece of work appears in two tasks
  - dependencies are stated, not implied by ordering
  - nothing in the agreed scope is left unassigned to a task

autonomy:
  depth: high
  decisions: none
escalates:
  - decomposing reveals a design question that was never settled
  - the scope cannot be covered without adding something nobody agreed to

applies_rules:
  - decision-authority
  - evidence-and-claims

# Not to be confused with decompose-into-workstreams, which splits ONE task
# for parallel execution right now and cares about disjoint write sets.
---

# Decompose into tasks

## Goal

Cut agreed work into units that can be picked up separately — including by a session that was not present for the planning.

## The boundary that matters

**A task ends where it can be verified.** Not where a file ends, not where a layer ends. If checking whether a task is done requires finishing the next one, the cut is in the wrong place — and the symptom is a series of tasks that are all "done" while nothing works.

Vertical slices beat horizontal layers for this reason. "The whole data layer" cannot be verified; "this one operation, end to end, for one case" can.

## What each task carries

Because the executor may have none of the planning context:

- **outcome** — one sentence, what is true afterwards;
- **boundaries** — what is in, and explicitly what is not;
- **dependencies** — which tasks must land first, by id;
- **acceptance criteria** — checkable, not aspirational;
- **the decisions it rests on** — so it is not re-litigated by whoever picks it up.

That last one is what makes decomposition durable. A task that omits its decisions invites the executor to make them again, differently.

## Do not

- Do not invent scope. Everything in the decomposition traces to the agreed solution; anything else is a new proposal and gets flagged as one.
- Do not create a task whose only content is "investigate" unless investigation genuinely is the deliverable — and then say what its output should be.
- Do not order tasks by layer out of habit. Order by what unblocks what.

## Output

```yaml
tasks:
  - id: ""
    outcome: ""
    in_scope: []
    out_of_scope: []
    depends_on: []
    acceptance: []
    decisions: []      # settled upstream; not open for reconsideration
    complexity: S|M|L
order: []              # what can start now, what waits
parallel: []           # groups that can run at once
unassigned: []         # agreed scope not covered by any task — should be empty
```
