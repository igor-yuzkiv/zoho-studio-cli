---
id: clarify-task
title: Clarify task
kind: operation
description: Separate what the task states from what it leaves open, and turn the gaps into answerable questions.
applies_to: [text, decisions]
use_when:
  - the task came from a client, a ticket, or a conversation rather than a finished spec
skip_when:
  - the task is fully specified and nothing depends on an unstated choice

requires:
  - task description and whatever materials came with it
produces:
  - stated requirements, inferred requirements, assumptions, contradictions, open questions
completion_criteria:
  - stated and inferred are separated, not merged into one list
  - every open question names what changes depending on the answer
  - blocking questions are marked apart from the rest

autonomy:
  depth: high
  decisions: none
escalates:
  - two stated requirements contradict each other

applies_rules:
  - evidence-and-claims
  - decision-authority
applies_principles:
  - eli5
---

# Clarify task

## Goal

Find what the task does not say, before the gaps get filled by whoever implements it.

An unstated choice is not an absence — it is a decision that will be made silently, by the least informed participant, at the worst moment.

## Steps

1. **Extract what is stated.** Requirements, constraints, and the expected outcome, as written. Not your reading of them.
2. **Name what you inferred.** Anything you concluded rather than read goes in a separate list, marked as inference.
3. **Find contradictions.** Two requirements that cannot both hold, or a requirement that conflicts with observed behaviour.
4. **Formulate questions.**
5. **Mark what blocks.** Most open questions do not stop the work; a few do. Say which.

## What makes a question worth asking

**A good question names what changes depending on the answer.** "Should partially-paid invoices be included?" is a question — one answer means a filter, the other means a new state. "What is the timeline?" is not; it changes nothing about what gets built.

Questions that cannot change the work are a survey, and a survey trains the reader to stop answering.

Prefer questions carrying a recommended answer and its consequence. A client who has to invent an answer from scratch takes days; a client confirming or rejecting a proposal takes minutes.

## Output

```yaml
goal: ""                    # the outcome in one sentence
stated_requirements: []     # as written
inferred_requirements: []   # concluded — each with what it was concluded from
constraints: []
acceptance_candidates: []   # checkable statements this work could be judged by
assumptions: []             # proceeding on these unless told otherwise
contradictions: []          # what conflicts with what
open_questions:
  - question: ""
    blocks: true            # does work stop without this
    depends_on_answer: ""   # what changes either way
    recommendation: ""      # proposed answer, if there is a sensible default
```
