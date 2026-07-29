---
id: run-coverage-pass
title: Run coverage pass
kind: operation
description: Walk the coverage lenses against the work at hand and turn what is missing into questions, decisions, or spec content.
applies_to: [code, decisions]
use_when:
  - planning anything beyond a trivial change
  - reviewing a plan or a spec before it is acted on
skip_when:
  - the change is a one-line fix with no persisted state, no interface, and no consumers

requires:
  - a description of the intended change, at whatever level of detail exists
produces:
  - answered dimensions, folded into the plan or spec
  - open questions, each attributed to who can answer it
  - dimensions deliberately ruled out, with the reason
completion_criteria:
  - every lens was either applied or explicitly ruled out
  - nothing was recorded as answered without an actual answer
  - each open question names who can settle it

autonomy:
  depth: high
  decisions: none
escalates:
  - a lens surfaces something that changes the shape of the solution

applies_rules:
  - evidence-and-claims
  - decision-authority
---

# Run coverage pass

## Goal

Find what the plan does not mention. Not what is wrong with it — what is **absent** from it.

This is the cheapest step in planning and the one that most reliably pays. Reviewers are not worse at spotting gaps than at spotting errors; they are simply never asked to look for them. The lens list is the asking.

## How

Start from `.claude/blocks/index.yaml` — it carries every lens with its `description`, `use_when`, and `skip_when`, which is all that is needed to decide what applies. Open only the ones that do.

For each relevant lens:

1. Check `use_when` against the change. Not relevant — say so and move on, in three words.
2. Relevant — ask its `questions`.
3. Check `red_flags`: these are signs the dimension is in play *although nobody mentioned it*. That is where the real finds are — what was never raised, rather than what was raised and left open.

## Where each answer goes

Three destinations, and every answer takes exactly one:

- **known** → into the plan or the spec as context or a settled decision;
- **unknown, and mine to decide** → onto the decision list, or into the spec's *must not decide*;
- **unknown, and someone else's to answer** → into open questions, with the name of who can answer.

A dimension nobody can answer yet is a legitimate outcome. Recording it as answered is not.

## Do not

- Do not run every lens on every change. `skip_when` exists so that a small task stays small.
- Do not turn a lens into a redesign. The output is questions, not architecture.
- Do not mark a dimension covered because it was discussed. Covered means answered.

## Output

```yaml
applied: []          # lens id — what it surfaced
not_applicable: []   # lens id — one line on why
into_spec: []        # answered; where it landed
decisions_needed: [] # mine to settle, with the options if they are already visible
open_questions:      # someone else's to answer
  - question: ""
    who: ""
    blocks: true|false
```
