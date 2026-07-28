---
id: wrap-up-work
title: Wrap up work
kind: operation
description: Turn finished work into a commit, a task update, and whatever the outside world needs to know.
applies_to: [code, text, client-communication]
use_when:
  - a change is verified and being handed off, committed, or closed

requires:
  - verified change with its evidence
  - task context and the project profile for artifact addresses
produces:
  - commit or pull request
  - task update
  - outward update, where one is owed
completion_criteria:
  - what remains undone is stated, not omitted
  - each artifact went where the project profile says it goes
  - nothing is claimed as verified that was not

autonomy:
  depth: high
  decisions: none
escalates:
  - the work is done but a decision from the wrap-up surfaced something unresolved
  - an outward-facing message would commit to something not yet agreed

applies_rules:
  - artifact-routing
  - communication-defaults
  - definition-of-done
applies_principles:
  - bluf
  - eli5
---

# Wrap up work

## Goal

Leave the work in a state where someone else — including you in three weeks — can tell what changed, why, and what is still open.

## Commit or pull request

The message answers **what changed and why**. The diff already shows how.

Why is the part that decays: in six months the diff is still readable and the reason is gone. A commit that says "fix tariff recalculation" without saying which condition was wrong forces the next reader to reconstruct it from scratch.

Reference the task. Keep the subject line to the change itself, not the process that produced it.

## Task update

Three things, in this order:

1. **what changed** — outcome first, not a narration of the work;
2. **what was verified** — which checks, and what they showed;
3. **what remains** — unmet criteria, deferred items, surfaced-but-unfixed findings.

The third is the one that gets quietly dropped, and it is the one the reader most needs.

## Outward update

For a client or a non-technical reader: [[bluf]] for order, [[eli5]] for register. Describe behaviour, not implementation. State what they can now do that they could not before, and what is still pending.

Do not commit to anything that was not agreed. A wrap-up message is a report, not a negotiation — see [[decision-authority]].

## Where things go

Every artifact here has an address that belongs to the project, not to this catalog. The commit goes to the repository; the task update, the decision record, and the outward message go wherever the project profile says. No entry in the profile means ask once and record the answer — see [[artifact-routing]].

## Output

```yaml
commit: ""              # message, or PR title and body
task_update: ""
outward_update: ""      # where one is owed
remaining: []           # unmet criteria, deferred work, unfixed findings
routed_to: []           # artifact — destination taken from the profile
```
