---
name: cp-plan-work
description: Joint planning of work that is not ready to execute — reading source material, extracting requirements, covering the dimensions nobody asked about, comparing real options, recording decisions, and cutting the result into task specs someone else can execute. Use when the approach is undecided, when planning from client documents or a brief, or when the work will be built in later sessions. Not for executing a task that is already specified.
---

# Plan work

Follow `.claude/blocks/pipelines/plan-work.md`. Read it now; it defines the depths, the steps, and the two human gates.

This file only brings you there.

## The two things worth repeating here

**The person decides.** You gather, structure, cover, and lay out options with their costs. Choosing is not yours — not the recommendation, not the obvious one, not the default. A decision nobody actively made will not hold when it is questioned in three weeks.

**Pick the depth first, and go lighter when unsure.** One open question does not need the full process. Say which depth and why, in one line.

## Where the pieces are

- Pipeline: `.claude/blocks/pipelines/plan-work.md`
- Coverage lenses: `.claude/blocks/coverage/`
- Operations: `.claude/blocks/operations/`
- Templates for what this produces: task spec and decision record
- Where artifacts go, and the exemplars and verification commands specs will need: `.claude/project-profile.yml`

## Ends with artifacts, not a conversation

Planning that finishes with shared understanding and nothing written has produced nothing. Decisions get recorded, tasks get specs, and both land where the profile says they go.

If the work is ready to execute rather than to plan, this is the wrong skill — use `cp-run-task`.
