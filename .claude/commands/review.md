---
description: Independent review of the current diff, separate from whoever wrote it
argument-hint: [optional — a path, a commit range, or what to focus on]
allowed-tools: Bash(git diff:*), Bash(git status:*), Bash(git log:*)
---

Review target: $ARGUMENTS

If no target was given, review the uncommitted working diff. Establish what it is first:

!`git status --short`

!`git diff --stat`

Then delegate to the `code-reviewer` subagent. Do not review it yourself in this context — a reader who just wrote the code is not an independent reader, and the whole value of this command is the separation.

Pass the reviewer:

- the diff;
- the task or intent the change was meant to serve, if it is known in this session;
- any acceptance criteria that exist.

If the intent is not known, say so when delegating. A review with no idea what the change was for can still check correctness, but it cannot check whether the change did what was asked — and it should say which of the two it did.

Report the reviewer's findings as returned. Do not soften them, and do not add findings of your own to the same list.
