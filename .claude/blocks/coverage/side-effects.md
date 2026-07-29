---
id: side-effects
title: Side effects
kind: coverage
binding: guidance
description: What else fires when this runs — events, observers, jobs, notifications, cache, webhooks.
applies_to: [code, decisions]
use_when:
  - a record is created, updated, or deleted
  - a status or state transition is added or changed
  - anything is written that other code watches
skip_when:
  - the change is read-only and emits nothing
questions:
  - What is listening to this — model events, observers, subscribers, hooks?
  - Does anything get sent to a person as a result? Is that wanted every time?
  - What caches now hold a stale value, and who invalidates them?
  - Are outbound webhooks or third-party syncs triggered?
  - Does this run inside a transaction? Do the side effects fire before it commits?
  - During a backfill or bulk import, do these fire once per row?
red_flags:
  - a model with observers or lifecycle hooks
  - notification logic attached to a status change
  - a bulk operation touching records that individually trigger events
  - cached aggregates derived from what is being written
escalate_if:
  - a side effect reaches a customer and the intent to send it was never stated
---

# Side effects

The characteristic failure is not that a side effect is wrong. It is that **nobody knew it existed** — the change looks like a one-line update, and it silently emails four hundred people because a status transition has a listener attached three files away.

Bulk operations are where this becomes expensive: logic that is harmless once becomes four hundred emails, four hundred webhooks, or four hundred queue jobs.

Before changing a write path, find what observes it. Grep for the model name in event, listener, and observer registrations — that is a minute of work against a category of incident that is very hard to undo.
