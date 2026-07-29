---
id: concurrency-and-idempotency
title: Concurrency and idempotency
kind: coverage
binding: guidance
description: What happens when this runs twice at once, or twice in a row, or is retried after a timeout.
applies_to: [code, decisions]
use_when:
  - a background job, webhook handler, or scheduled task
  - anything triggered by a user action that could be repeated
  - a read-then-write sequence on shared data
skip_when:
  - a single-user local operation with no shared state
questions:
  - What if two requests arrive at the same moment for the same record?
  - What if the job runs twice — retry, redelivery, double click?
  - Is there a read-modify-write that could lose an update?
  - Does a unique constraint exist in the database, or only in application code?
  - If a webhook is delivered twice, is the second one a no-op?
  - Does the operation have a natural key that makes repeating it safe?
red_flags:
  - check-then-insert without a unique index
  - a counter or balance updated by reading and writing back
  - a queue with at-least-once delivery and no deduplication
  - a submit button with no protection against a second click
escalate_if:
  - correctness needs a lock whose scope affects throughput
---

# Concurrency and idempotency

Both questions here reduce to one: **is repeating this operation harmless?** If yes, most of the difficulty disappears — retries become safe, delivery guarantees stop mattering, double clicks stop being a bug.

So the productive move is not to add locking, it is to look for a natural key that makes the operation idempotent. Locks are the fallback when that is impossible.

Uniqueness enforced only in application code is the recurring specific failure: the check passes in both concurrent requests, and both insert. If a value must be unique, the database has to say so.
