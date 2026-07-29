---
id: plan-work
title: Plan work
kind: pipeline
description: Joint planning — from source material to decisions to task specs someone else can execute.
applies_to: [decisions, code, text]
use_when:
  - the approach is not settled, or the work is large enough to need cutting up
  - execution will happen later, or in other sessions
skip_when:
  - the task is ready to execute — that is run-task

requires:
  - source material: documents, a ticket, a conversation, or a stated goal
produces:
  - shared understanding of what is being built and what is still unknown
  - decisions, recorded
  - tasks with specs, filed where the profile says
completion_criteria:
  - stated and inferred requirements are separated
  - every coverage lens was applied or ruled out
  - every decision that shapes the work was made by the person, and recorded
  - each task can be verified on its own and carries the decisions it rests on

autonomy:
  depth: high
  decisions: none
escalates:
  - any decision — that is the point of this pipeline
---

# Plan work

## What this is

**A joint process with a fixed division of labour.** The agent gathers, structures, covers, and lays out options. The person decides. Neither half works alone: unstructured discussion misses dimensions, and an agent deciding architecture produces confident answers to questions it was not entitled to answer.

The output is not a document. It is **decisions that survive the session, and tasks that can be executed by someone who was not in it.**

## Size it first

As with `run-task`, ceremony scales with the work, and the tie-breaker is the same: when unsure, go lighter.

| Depth | When | Steps |
|---|---|---|
| **shape** | one open question, approach otherwise clear | coverage on the relevant lenses → options → decision → done |
| **standard** | a feature: several decisions, work for a few sittings | all steps |
| **deep** | non-technical source material, or consequences beyond this feature | all steps, with `requirements-analyst` and `critic` |

Say which and why, in one line.

## Steps

**1. Extract** — [[clarify-task]] **through `requirements-analyst`** whenever the material runs past a couple of files. Not "when it is long" — that judgement resolves to "not this time" every time. See [[delegate-orientation]].

Stated and inferred come back as separate lists and stay separate. Everything downstream depends on that line holding.

**2. Orient** — [[orient-in-codebase]], fanned out with narrow scopes. Name them in one line before launching.

Planning against an imagined codebase produces plans that die on contact. Ask what actually exists before deciding what to add.

**3. Coverage** — [[run-coverage-pass]].

Where the process earns its name. The lenses ask what nobody thought to ask, and their `red_flags` catch dimensions that are in play although the material never mentions them.

**▣ Human gate** — questions for the client or the product owner go out now, not after the design is built on top of guesses.

**4. Options** — [[compare-options]], per decision that has more than one real answer.

Two or three, each one you would actually build, each with what it forecloses.

**▣ Human gate — the decision.** This is not delegated. Not the recommendation, not the default, not the obvious one: the person chooses.

**5. Record** — [[record-decision]].

A convincing concept is not a decision. Without this step the same debate returns in three weeks with nobody remembering it was settled.

**6. Cut** — [[decompose-into-tasks]].

Each task verifiable on its own, carrying the decisions it rests on.

**7. Specify** — [[write-task-spec]] per task, and [[test-designer]] where acceptance is not obvious from the requirement.

**8. Check** — [[critic]] in `spec` mode on anything going to a weaker model or another session.

One question: is there a point where the executor would have to choose? If yes and it is not settled or forbidden, the spec is not ready.

## What must not slip

**Do not design during extraction.** The pull toward "here is how I would build it" arrives during step 1, before anything is understood. Structure first.

**Do not let a recommendation become the decision.** Recommending is the agent's job; choosing is not. A decision recorded because nobody objected is not a decision, and it will not hold when it is questioned later.

**Do not answer a coverage question with a plausible guess.** Unknown is a valid answer and belongs in open questions. A guess recorded as an answer is worse than a gap, because nobody will check it again.

**Do not stop at the document.** Planning that ends in a well-written concept and no specs has produced nothing executable. The artifacts are the point.
