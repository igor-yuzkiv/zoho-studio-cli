---
id: kiss
title: KISS — keep it simple
kind: principle
binding: guidance
description: Choose the simplest solution that fully closes the current problem and known requirements.
applies_to: [code, decisions, text]
use_when:
  - choosing between solution shapes
  - deciding how much structure a document or plan needs
skip_when:
  - the complexity is already justified by a requirement you can name
---

# KISS — keep it simple

**Choose the simplest solution that fully closes the current problem and the requirements you actually know about.**

Simple is not primitive and not temporary. It has to be understandable, sufficient, and maintainable — the simplest thing that is genuinely enough, not the smallest thing that technically runs.

## In practice

**Investigating.** Do not chase scenarios that cannot change the outcome. Separate real requirements from possible future wishes. Research that quietly turns into designing the whole system is no longer research.

**Shaping a solution.** Start from the minimum that closes the main scenario. Complexity needs a named reason — a requirement, a constraint, a failure you have actually seen.

**Planning.** Break work into stages a reader can follow. Do not specify implementation detail that is not needed to make the decision at hand. Do not manufacture intermediate artifacts.

**Writing.** Plain wording. Drop sections that carry no practical use. One idea, one obvious place.

## Check

- Can this be explained more simply?
- Is every part of this actually needed?
- Are we solving a problem we do not have yet?
- Can I name the reason for each piece of complexity?

The last question is the useful one. Complexity that cannot be traced to a reason is not sophistication, it is residue.
