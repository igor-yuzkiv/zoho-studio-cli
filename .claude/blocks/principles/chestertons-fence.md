---
id: chestertons-fence
title: Chesterton's fence
kind: principle
binding: guidance
description: Do not remove what you do not understand until you know why it is there.
applies_to: [code, decisions]
use_when:
  - deleting code, a check, a condition, or a configuration whose purpose is unclear
  - the change touches legacy nobody has explained
---

# Chesterton's fence

**Before removing something, establish why it was put there. Code that looks pointless is the most likely thing to be load-bearing.**

The original form: coming across a fence in a field, the reformer says "I see no use for this, let us clear it away". The answer is — go find out why it was built, and then we can talk about removing it.

## Why this bites hardest in legacy

Odd-looking code usually has one of three origins:

- **a bug fix** — a guard clause for a case that occurred once, in production, expensively;
- **a workaround** — for an upstream behaviour that is still there;
- **genuine residue** — dead code from a removed feature.

Only the third is safe to delete, and the three are indistinguishable by reading the code alone. That is the whole problem: the fix and the residue look identical.

## How to find out cheaply

- `git log` and `git blame` on the lines — the commit message often is the answer.
- The linked ticket or PR, if the commit references one.
- Tests that cover the branch. A test asserting the odd behaviour is a strong signal it was deliberate.
- Callers. Something checking for the condition you were about to drop is the fence's post.

Five minutes of history is normally enough to tell a guard from a leftover.

## When you still cannot tell

Leave it, and report it — see the report-don't-fix section of [[execution-discipline]]. "Unclear purpose, possibly dead, did not remove" is a useful finding. Silent removal of something that turns out to matter is not discovered by review; it is discovered in production, by a user.

## The limit

This is not an argument for never deleting anything. It is an argument for the order of operations: understand, then decide. Once the purpose is established and gone, removal is the right call — and now it is a decision you can defend.
