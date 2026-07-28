---
id: decompose-into-workstreams
title: Decompose into workstreams
kind: operation
description: Split the work into units that can run in parallel without colliding, and fix the contracts they share.
applies_to: [code, decisions]
use_when:
  - the task is large enough that units could be executed independently
skip_when:
  - the work is a single coherent change, or units cannot be verified independently

requires:
  - agreed scope
  - context map covering the areas the work touches
produces:
  - workstreams with exclusive write sets, dependency edges, verification per unit
  - shared contracts, decided before fan-out
  - integration plan
  - serial_only — what is deliberately not parallelized, with the reason
completion_criteria:
  - no two workstreams claim the same file
  - every workstream can be verified without waiting for the others
  - every interface two workstreams both touch is already decided and written down

autonomy:
  depth: high
  decisions: none
escalates:
  - a shared contract cannot be settled without a design decision
  - write sets cannot be made disjoint and isolation is not available

applies_rules:
  - decision-authority
  - evidence-and-claims
---

# Decompose into workstreams

## Goal

Turn one task into units that can run at the same time without producing work that has to be redone at the seam.

## What actually breaks parallel work

Not conflicting edits — **conflicting decisions**.

Two executors independently invent two shapes for the same DTO, two error formats, two names for one field. Each is locally correct; together they are incompatible, and it surfaces at integration, when redoing it is expensive.

So the rule is: **anything two workstreams both depend on is decided here, before fan-out, and travels in every unit's spec as settled.** Signatures, data shapes, error format, names, module boundaries. Whatever this step leaves open will be invented once per executor.

## Two axes, different risk

**Reads parallelize freely.** Several `orient-in-codebase` runs with narrow scopes have no conflict by construction, and they keep the main context clean. This is the default, not an optimization.

**Writes do not.** One of two conditions must hold:

- **disjoint write sets** — each unit owns its files exclusively, and that ownership is written into its spec;
- **isolation** — a separate worktree per executor, plus an explicit merge step, when the files genuinely cannot be split.

Neither available means serial. Parallelism that produces merge conflicts costs more than waiting.

## When not to parallelize

A unit must be large enough to justify its own spec and **independently verifiable**. If the only way to check a unit is to assemble all of them first, this is not parallel work — it is deferred risk with a progress bar.

Decomposition has real costs: a spec per unit, the shared contracts, the integration. Below some size those exceed the gain, and `serial_only` with one line of reason is the correct output of this operation, not a failure of it.

## Output

```yaml
workstreams:
  - id: ""
    outcome: ""
    owns_files: []        # exclusive write set
    depends_on: []        # ids that must land first
    verification: ""      # how this unit is checked on its own
shared_contracts: []      # decided here; executors do not revisit these
integration: ""           # who assembles, and how the seam is verified
serial_only: []           # deliberately not parallelized — with the reason
```
