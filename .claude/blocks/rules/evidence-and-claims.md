---
id: evidence-and-claims
title: Evidence and claims
kind: rule
binding: mandatory
description: Separate what was verified from what was inferred, and mark which is which.
applies_to: [code, text, decisions]
use_when:
  - reporting findings, describing how a system behaves, making a recommendation
---

# Evidence and claims

**Everything you state is either something you checked or something you inferred. The reader must be able to tell which, without asking.**

## Evidence is a location, not a feeling

A claim about code is backed by `file:line` you actually opened. "The service probably handles this" is not a finding; it is a hypothesis wearing a finding's clothes.

Evidence goes stale. A path remembered from earlier in the session, or carried in from a context map, is an assumption until re-read. Behaviour drifts, files move, and the confident sentence survives both.

## Do not launder inference into fact

The failure mode is quiet: a hedge gets dropped in the summary, and by the third mention the guess has become the premise. Once that happens it is nearly impossible to unwind, because nothing in the text marks where the certainty came from.

Keep the marker attached to the claim, not to a caveat paragraph somewhere above it.

## Not checked is a valid answer

Saying "I did not verify this" costs one clause. Being wrong about it costs a review cycle, and sometimes a release. Where the check is cheap, run it; where it is not, say so and let the reader decide whether it matters.

## In review and critique

A problem without evidence is an **observation**, not a defect. Both are worth reporting — but not as the same thing, and not with the same weight.

Findings that cannot point at anything train the reader to skim, and a critic who gets skimmed is worse than no critic at all.
