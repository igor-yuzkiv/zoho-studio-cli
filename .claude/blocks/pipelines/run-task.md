---
id: run-task
title: Run task
kind: pipeline
description: The default operational cycle — orient, decide how much ceremony the task deserves, execute, verify, review, close.
applies_to: [code]
use_when:
  - any piece of work that is ready to be executed
skip_when:
  - the approach is undecided — that is concept work, not execution

requires:
  - a task, ticket, or agreed outcome
produces:
  - verified change, review result, closed task, whatever update is owed outward
completion_criteria:
  - the outcome is met or the gap is stated
  - verification evidence exists
  - unfixed findings and open questions are recorded, not dropped

autonomy:
  depth: high
  decisions: none
escalates:
  - any operation in the cycle escalates
---

# Run task

## Pick the lane first

**The most common way this pipeline fails is by being too heavy.** A validation tweak dragged through the full cycle twice teaches you to stop invoking it, and then none of this exists.

So the first act is sizing, and the tie-breaker is fixed: **when unsure, go one lane lighter.** An under-ceremonied task costs one extra step later; an over-ceremonied one costs your willingness to use the system at all.

| Lane | When | Steps |
|---|---|---|
| **direct** | one file, behaviour already established, no unknowns | implement → verify |
| **standard** | a normal task: a few files, some unknowns | orient → clarify → implement → verify → review → wrap-up |
| **wide** | large enough to split, or spanning areas | orient ⇉ → clarify → decompose → implement ⇉ → verify → review → wrap-up |

Say which lane you picked and why, in one line. That line is what lets the choice be corrected instead of silently repeated.

## The cycle

**1. Orient** — skipped in the direct lane.

Two different questions live here, and they are answered differently. Conflating them is the most common way this step goes wrong.

| Question | How |
|---|---|
| Where does this live, how does it flow, what will it affect | [[orient-in-codebase]] via subagent — returns a map |
| What shape should the new code take | **read the exemplar directly**, in this context |

A subagent returns a compressed map, and a map is the wrong output for "write a file like this one". Nobody can write code analogous to `pull-fields.command.ts` from a summary of it — they need its text. The profile's `exemplars` names those files; open them here, fully and deliberately.

That is not a breach of context hygiene, it is the point of it: two exemplars read on purpose cost far less than forty files read blind, which is what the subagent exists to prevent.

In the wide lane, fan out the map side: several narrow scopes at once rather than one agent told to understand everything. Reads never conflict, so this parallelism is free.

**2. Clarify** — [[clarify-task]].

Blocking questions stop here and go to the human, carrying options and a recommendation. Non-blocking ones are recorded and the work continues past them.

**▣ Human gate** — only if something blocks.

**3. Decompose** — [[decompose-into-workstreams]], wide lane only.

Shared contracts are settled here, before any fan-out. A contract left open gets invented once per executor. If settling one needs a design decision, that is an escalation, not a judgement call.

**▣ Human gate** — if a shared contract requires a decision.

**4. Implement** — [[implement-change]].

Parallel only where write sets are disjoint or executors are isolated in separate worktrees. Otherwise serial. Each unit carries its own spec, its exclusive file list, and the shared contracts as settled.

**5. Verify** — [[verify-change]].

Per unit, then at the integration seam. A unit that cannot be verified on its own was decomposed wrong.

**6. Review** — [[review-change]], through a subagent so the reader has not just written the code.

**7. Wrap up** — [[wrap-up-work]].

## What travels through

Each step's output feeds the next. What does not survive the handoff does not exist: an unfixed finding noticed at implement time is lost unless it reaches wrap-up.

Three things must arrive at the end intact:

- **unfixed findings** — surfaced and deliberately left alone;
- **open questions** — asked and unanswered;
- **unverified claims** — believed but not checked.

Dropping any of them turns a partial result into a report of a complete one.

## Skipping steps

Skipping is allowed and expected — that is what lanes are for. Skipping *silently* is not. One line naming the step and the reason keeps the cycle honest and makes the lane choice reviewable later.
