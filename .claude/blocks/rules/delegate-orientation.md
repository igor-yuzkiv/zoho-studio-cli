---
id: delegate-orientation
title: Delegate orientation
kind: rule
binding: mandatory
description: Reading to find out is delegated to a subagent. Reading to transform is done here.
applies_to: [code, text]
use_when:
  - answering a question about a codebase, a body of documents, or how something works
---

# Delegate orientation

**If you are reading to find out, delegate. If you are reading to transform, read here.**

## The trigger

By the time you are opening a **third file to answer one question**, that question belonged to a subagent. Launch it instead.

This counts every channel. `cat`, `sed`, `head`, a batched `grep`, six files chained into one Bash call — all of it lands the same content in this context. Batching is not cheaper; it is the same dump with fewer tool calls, which makes it harder to notice rather than smaller.

## Delegate

- *What exists here, how does this flow work, what will this change touch* → `code-explorer`.
- *What do these documents state, imply, and contradict* → `requirements-analyst`.

Several **narrow** scopes in parallel, not one agent told to understand everything. Reads never conflict, so this costs wall-clock once instead of once per scope, and the answers come back as maps rather than as material.

## Read here

Delegation is wrong when the text itself is the thing you need:

- the **exemplar** you are about to write code like — a summary of a file cannot carry the shape of it;
- a document whose **exact wording** you are reconciling or quoting;
- a single file whose location and relevance you already know.

Two files read deliberately are not the problem. Forty read to orient yourself are, and so are twelve.

## Say what you launched

One line, before launching: which scopes, and why those. Same discipline as naming the lane.

Not for ceremony — because a skipped delegation is otherwise invisible. The session looks productive either way, and the cost only shows up later, as a context that filled three times faster than it should have.

## Why this is a rule and not advice

Because as advice it loses, every time. Delegating costs a round trip now; reading inline costs context later. Under any local pressure the agent takes the near saving, and the bill arrives in a session that has stopped being able to think clearly about a task it has been working on for an hour.
