---
id: self-documenting-code
title: Self-documenting code
kind: principle
binding: guidance
description: Code explains itself through naming and structure; a comment earns its place only by carrying why.
applies_to: [code]
use_when:
  - writing or changing code
skip_when:
  - editing generated files, or a codebase whose established style is heavily annotated
---

# Self-documenting code

**Code must explain itself before a comment becomes necessary.**

The default for new code is zero comments. That is not a prohibition — it is where the count starts, so that each comment has to argue for itself rather than appear by habit.

## Structure first

- Introduce an explanatory variable when a condition or expression needs a name to be readable.
- Extract a function when a block needs a heading. The function name *is* the heading, and unlike a heading it cannot drift from what follows it.

## What a comment is for

A comment is justified by **why**, never by **what**:

- non-obvious intent — the reason this is done at all;
- a constraint that is not visible from here — an API's behaviour, a rate limit, an ordering requirement;
- a trade-off that was made deliberately;
- a decision that would otherwise look like a mistake.

## Two kinds that agents write and people do not

Worth naming separately, because they arrive by default rather than by choice:

- **Narrating the change.** `// Added validation here`, `// Updated to handle the new case`. The diff already says this, and once merged it describes history nobody needs. It belongs in the commit message, which exists for exactly that — see [[wrap-up-work]].
- **Addressing the reviewer.** `// Note: kept this simple as discussed`, `// Let me know if you prefer X`. That is a message to a person, not documentation of code, and it outlives the conversation by years.

Also skip the comment that restates the line below it.

## Existing comments

Preserve them unless they are incorrect or obsolete. A comment you do not understand is more likely to be load-bearing than wrong — that is [[chestertons-fence]] applied to prose.

## Check

- Could this comment be deleted by renaming something instead?
- Does it say why, or does it repeat the line below it?
- Will it still be true after the next change to this function?
