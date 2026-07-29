---
id: data-migration-and-backfill
title: Data migration and backfill
kind: coverage
binding: guidance
description: Whether existing data has to move, change shape, or be filled in — and what happens to the rows that do not fit.
applies_to: [code, decisions]
use_when:
  - a schema, a stored shape, or the meaning of an existing field changes
  - a new required field is added to something that already has rows
  - data starts being written somewhere it was not written before
skip_when:
  - nothing persisted changes shape or meaning
questions:
  - What happens to rows that already exist?
  - Which of them do not satisfy the new rule, and what is done with those?
  - Is the backfill one-off or does it run repeatedly until complete?
  - How long does it take on production volume, and does it hold a lock while it runs?
  - Can old and new shapes coexist during the rollout, or is there a moment where both are wrong?
  - How is a partially-completed backfill resumed?
  - How do we verify afterwards that it actually worked?
red_flags:
  - a new column declared NOT NULL without a default
  - the migration was tested on an empty or seeded database only
  - a plan that says "migrate the data" without saying which rows are problematic
  - historical rows created under rules that no longer exist
escalate_if:
  - some existing rows cannot be mapped to the new model at all — what to do with them is a product decision
  - the backfill needs downtime
---

# Data migration and backfill

The part that gets missed is almost never the schema change. It is **the rows that already exist and do not fit** — records created years ago under rules nobody remembers, half-filled drafts, entries from a feature that was removed.

A migration tested against a fresh database proves the syntax is valid and nothing else.

Ask what the oldest and strangest rows look like before deciding the new shape. If nobody knows, that is the first finding.
