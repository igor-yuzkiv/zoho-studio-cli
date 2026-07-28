---
id: execution-discipline
title: Execution discipline
kind: rule
binding: mandatory
description: Do exactly what the task specifies. Report adjacent problems instead of fixing them.
applies_to: [code]
use_when:
  - any change to an existing codebase
---

# Execution discipline

**Do exactly what the task specifies. Nothing adjacent, nothing extra, nothing "while I'm here".**

## Scope

Change only what the task requires to reach its stated outcome.

If reaching that outcome requires touching something outside the stated scope, **stop and say so** before touching it. Expanding scope silently is the most common way a small change becomes unreviewable.

## Minimal diff

Keep the diff to what the outcome requires. Reformatting, renaming, import reordering, and pattern modernization in a file you opened for another reason are all out of scope.

The reason is not tidiness: a diff that mixes the required change with incidental churn cannot be reviewed. The reviewer either approves the churn unread or rejects the whole thing.

## When the surrounding pattern looks wrong

Following the surrounding code is the default. When that pattern is genuinely wrong for this case, say so and ask — do not quietly diverge. A lone file that follows a better convention is just an inconsistency to the next reader.

## Report, don't fix

When you find a bug, dead code, a missing check, or a poor pattern next to your work:

1. Finish the task you were given.
2. Report what you found: `file:line`, one line on what it is, one line on why it matters.
3. Leave it unchanged.

The only exception is when the task cannot be completed correctly without the fix. Then say that explicitly, and say what you are about to change, before changing it.

## Stop and ask

- The task's outcome is unreachable within the stated scope.
- Two parts of the task contradict each other.
- The change would alter behaviour that other code or callers depend on, and the task does not mention them.
- There is no existing pattern to follow and the choice has lasting consequences.

Stopping costs a message. Guessing costs a review cycle, and sometimes a release.

## What this rule is not

This is not "never improve anything". Improvements are legitimate work — they are simply *separate* work, with their own scope and their own approval.

The rule exists so that "I also cleaned up a few things along the way" never appears in a diff that nobody asked for.
