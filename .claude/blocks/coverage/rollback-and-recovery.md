---
id: rollback-and-recovery
title: Rollback and recovery
kind: coverage
binding: guidance
description: How this is undone if it turns out badly in production — and whether undoing it is even possible.
applies_to: [code, decisions]
use_when:
  - a migration, a backfill, a contract change, or anything touching stored data
  - a change that is deployed rather than merely merged
skip_when:
  - the change is additive, isolated, and reverting the code is genuinely enough
questions:
  - Is deploying the previous version enough? If data changed shape, it is not.
  - How is a half-finished backfill undone, or is it forward-only?
  - Can we go back if the old and new code have both been writing for an hour?
  - Is there a way to disable this without a deploy — a flag, a setting?
  - What is the recovery path if it is discovered a week later rather than immediately?
  - Do we have the data needed to reconstruct what was overwritten?
red_flags:
  - a migration that drops a column or a table
  - an in-place update with no copy of the previous value
  - a change described as "we can just revert" when it writes data
  - a rollout with no way to stop it partway
escalate_if:
  - the change is genuinely irreversible — that has to be a stated, accepted decision
---

# Rollback and recovery

"We can revert the deploy" holds only while the change is code. The moment it writes, reverting the code leaves the data where it was — in the new shape, read by the old version.

The question worth asking early is **can this be turned off without a deploy**. A setting or a flag converts an incident from a release cycle into a minute, and it is far cheaper to add while writing the feature than after.

Irreversibility itself is acceptable — dropping a column eventually has to happen. What is not acceptable is arriving at it without anyone deciding it: that is a decision, and it belongs to a person.
