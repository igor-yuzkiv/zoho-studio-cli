---
id: compare-options
title: Compare options
kind: operation
description: Put two or three genuinely different approaches side by side with their real costs, so a person can choose.
applies_to: [decisions, code]
use_when:
  - the shape of the solution is not obvious, or more than one shape would work
  - a choice has consequences beyond this task
skip_when:
  - there is one reasonable approach and naming it is enough

requires:
  - the requirement, and enough context to know what is actually possible here
produces:
  - two or three options, each with what it costs and what it forecloses
  - a recommendation with its reason
  - the criteria the choice turns on
completion_criteria:
  - every option would genuinely work — no strawmen
  - each option states what it makes harder later, not only what it makes easier now
  - the recommendation is stated, with the reason, as a recommendation and not a decision

autonomy:
  depth: high
  decisions: none
escalates:
  - choosing requires product information not available here

applies_rules:
  - decision-authority
  - evidence-and-claims
applies_principles:
  - kiss
  - yagni
---

# Compare options

## Goal

Give a person what they need to choose, and stop there.

## What makes this useful rather than decorative

**Every option must be one you would actually be willing to build.** Two real options and one obviously bad one is not a comparison, it is a recommendation wearing a costume — and it wastes the reader's trust the moment they notice.

**Say what each option forecloses.** Advantages are easy and mostly symmetric. The information a decision actually turns on is the cost: what gets harder later, what becomes difficult to undo, what has to be maintained forever.

**Name the criteria.** Often the criteria decide the answer, and surfacing them ends the discussion faster than the options do — "if we care most about not breaking existing clients, it is B; if about shipping this week, it is A."

**Two or three.** One is not a choice. Five is a research report, and it moves the work of deciding back onto the reader.

## Include the null option where it is real

"Do nothing", "do the smallest version", and "solve it outside the code" are legitimate options and are routinely omitted. See [[yagni]].

## Output

```yaml
decision: ""            # what is being decided, in one sentence
criteria: []            # what the choice turns on, in order of weight
options:
  - name: ""
    how: ""             # what would actually be built
    costs: []           # what it makes harder, later or elsewhere
    forecloses: []      # what it takes off the table
    effort: ""
recommendation: ""      # which, and why
open: []                # what would change the recommendation if answered
```
