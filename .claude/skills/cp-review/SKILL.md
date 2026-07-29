---
name: cp-review
description: Independent review of a diff by someone other than whoever wrote it. Use when a change is finished, when asked to look over recent work, or at any point an outside read is wanted — including "check what I just did". Delegates to the code-reviewer subagent rather than reviewing in this context.
---

# Review

Establish what is being reviewed. Default to the uncommitted working diff:

```
git status --short
git diff --stat
```

If a path, a commit range, or a focus was given, use that instead.

## Delegate — do not review it here

Hand the diff to the `code-reviewer` subagent. **Do not read and judge it in this context**, even when it would be quicker.

The value of this whole operation is the separation. A reader who just wrote the code, or who watched it being written, cannot un-know the intent behind it — and intent is exactly what hides the defect. A review in the authoring context is a second opinion from the same opinion.

Pass the reviewer:

- the diff, or how to obtain it;
- the task or intent the change was meant to serve, if it is known here;
- any acceptance criteria that exist.

If the intent is not known, say so when delegating. A review with no idea what the change was for can still check correctness, but it cannot check whether the change did what was asked — and it should state which of the two it did.

## Report what came back

Findings as returned. Do not soften them, do not re-rank them, and do not append findings of your own to the same list — if you have one, it goes in a separate note, marked as yours.

`code-reviewer` reports and never fixes. Deciding what to act on is a separate step, and it is not the reviewer's.
