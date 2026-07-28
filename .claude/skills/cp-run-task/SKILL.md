---
name: cp-run-task
description: The default cycle for executing a piece of work in a codebase — orient, size the ceremony, implement, verify, review, close. Use when picking up a task, ticket, bug, or change request that is ready to be worked on, at any size from a one-line fix to a multi-part feature. Not for deciding what to build — that is concept work.
---

# Run task

Follow `.claude/blocks/pipelines/run-task.md`. Read it now; it defines the lanes, the steps, and the gates.

This file exists only to bring you there. Everything that governs the work is in the pipeline and the blocks it references.

## The one thing worth repeating here

**Pick the lane before doing anything else, and when unsure pick the lighter one.**

Running a one-line fix through orientation, decomposition, and independent review is how this system stops being used. The lanes exist so that ceremony scales with the work; defaulting to the heavy lane defeats them.

State the lane and the reason in one line, so the choice can be corrected rather than silently repeated.

## Where the pieces are

- Pipeline: `.claude/blocks/pipelines/run-task.md`
- Operations: `.claude/blocks/operations/`
- Rules that apply throughout: `.claude/blocks/rules/`
- Project-specific addresses, exemplars, and verification commands: the project profile

If the project has no profile, the addresses and verification commands are unknown — ask once and record the answers rather than guessing. See `.claude/blocks/rules/artifact-routing.md`.
