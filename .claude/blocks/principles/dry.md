---
id: dry
title: DRY — one source of truth
kind: principle
binding: guidance
description: Each important piece of knowledge has one primary home; elsewhere, link to it.
applies_to: [code, text]
use_when:
  - the same requirement, decision, or explanation is about to exist in two places
skip_when:
  - two things merely look alike but change for different reasons
---

# DRY — one source of truth

**One important piece of knowledge, one primary home. Everywhere else, link to it.**

The test is not "does this text appear twice" but "if this changes, how many places must be edited in agreement". Two copies that must always match are one thing stored twice.

## In documents

- A decision is recorded once as a decision artifact; everything else references it.
- Long-lived domain knowledge lives in the project's long-term store, not restated per task.
- A handoff carries the conclusions needed to act, not the research that produced them.
- Do not create a second document with the same purpose as an existing one.
- When a decision changes, update the primary source and mark the stale documents as superseded.

Where each of these lives is a property of the project, not of this catalog — see [[artifact-routing]].

## Acceptable repetition

A document must stand on its own. Restating something briefly so the reader does not have to follow a link is fine — a one-line problem statement in a handoff, the headline finding of research inside a concept, the decision in one sentence inside a plan.

Keep it short and link to the source. The copy is a signpost, not a second original.

## In code, the caveat matters more than the rule

**Duplication is far cheaper than the wrong abstraction.**

Two pieces of code that look identical today but change for different reasons are not duplication — they are coincidence. Merging them creates a shared thing that must serve two masters, and every future change pays for the merge. Unwinding it later is much harder than living with the copy.

Deduplicate when the two places represent *the same decision*. Leave them alone when they merely have the same shape.

## Check

- Where is the primary source of this?
- Will the same text need updating in more than one place?
- Can the copy be replaced by one sentence plus a link?
- Am I creating a new source of truth without needing one?
