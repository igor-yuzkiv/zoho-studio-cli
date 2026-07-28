---
id: eli5
title: ELI5 — explain without jargon
kind: principle
binding: guidance
description: Explain complex things in ordinary language without losing meaning.
applies_to: [client-communication, text]
use_when:
  - the reader knows the product but was not in the earlier discussions
  - writing for a client, a non-technical stakeholder, or your future self
skip_when:
  - the reader is a peer who shares the full context and needs precision more than accessibility
---

# ELI5 — explain without jargon

**The document should be understandable to someone who knows the product but was not part of the earlier conversations.**

This is not simplification to the point of inaccuracy. The goal is to remove hidden assumptions, unexplained jargon, and context the reader is silently expected to already have.

## In practice

- State the problem in ordinary words first.
- Expand any specific term the first time it appears.
- Explain not only what changes, but why.
- Add a short example wherever behaviour is not obvious.
- Do not make the reader reassemble context from several documents.
- Put complex detail after the plain explanation, not instead of it.

## A structure that usually works

1. What happens now.
2. What is wrong with it.
3. What is proposed.
4. How it will work, on one concrete example.
5. What limits or open questions remain.

## Check

- Would someone seeing this topic for the first time follow it?
- Is every important term explained?
- Can the main point be understood without opening anything else?
- Is anything important hiding behind technical vocabulary?
