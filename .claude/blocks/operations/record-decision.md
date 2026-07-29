---
id: record-decision
title: Record decision
kind: operation
description: Capture a decision as a first-class artifact, so it survives the session that produced it.
applies_to: [decisions, text]
use_when:
  - a choice was made that will constrain later work
  - a option was rejected for a reason worth not re-discovering
skip_when:
  - the choice is local to one file and visible in the code itself

requires:
  - the decision, and what it was chosen over
produces:
  - a decision record, filed where the project profile says decisions go
completion_criteria:
  - the decision is stated as a decision, not as a proposal
  - what was rejected, and why, is recorded alongside it
  - the assumptions it rests on are named

autonomy:
  depth: high
  decisions: none
escalates:
  - what was decided is unclear, or two people understood it differently

applies_rules:
  - artifact-routing
  - communication-defaults
applies_principles:
  - bluf
---

# Record decision

## Goal

Make a decision survive the conversation that produced it.

## Why this is a separate artifact

**A convincing document is not a decision.** This is the single most common failure in planning repositories: a well-argued concept sits there, everyone half-remembers agreeing, and three weeks later the same debate runs again from the beginning because nothing ever said *decided*.

The record exists to make that distinction unambiguous. Its first line states what was decided, in the past tense.

## What to capture

The parts that decay fastest, in order:

1. **The decision** — one sentence, unambiguous.
2. **What it was chosen over** — the rejected options, each with the reason. This is what stops the discussion restarting; without it, the first person to think of option B has no way to know it was already considered.
3. **The assumptions** — what has to stay true for this to remain right. These are also the trigger for revisiting it.
4. **The consequences** — what this now constrains.

Rationale is worth more than description. In six months the decision is still readable and the reason is gone.

## Do not

- Do not record a preference as a decision. If the person did not decide, the record says the decision is open.
- Do not quietly rewrite a record when a decision changes. Supersede it: the old one stays, marked, pointing at the new. The history of a reversal is usually more instructive than either state.
- Do not decide where the file goes — that is the project's, from the profile. See [[artifact-routing]].
