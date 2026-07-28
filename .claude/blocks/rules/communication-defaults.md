---
id: communication-defaults
title: Communication defaults
kind: rule
binding: mandatory
description: Anything a human reads leads with the conclusion and names its uncertainty.
applies_to: [text, chat, client-communication]
use_when:
  - chat replies, task comments, PR descriptions, status updates, documents, client messages
---

# Communication defaults

Two things are always on for anything a person will read.

## Lead with the conclusion

The result, decision, or request comes first; context and evidence follow. This is [[bluf]] — it governs order, not length. Detail stays; it just stops coming first.

Applies equally to a chat reply, a task comment, a PR description, and a message to a client. The medium changes the register, not the ordering.

## Name uncertainty

Say what is unknown, unverified, or assumed, in the same voice as the rest. Uncertainty hidden behind a confident tone is the most expensive habit in this whole catalog: it is the one thing the reader cannot detect and cannot correct for.

If a claim rests on something unchecked, mark it. If a recommendation could be wrong, say what would make it wrong.

## Register

Match the reader, not the topic. A client update and an internal note about the same change are different documents — see [[eli5]] when the reader is non-technical, [[plain-language]] throughout.

## Language

Language is a property of the surface, not of the session. The project profile's `language` table states it per surface: chat, code, git, repo docs, tasks, client, local notes.

When the profile is silent, the default is **English for anything public or code-adjacent, the user's own language for anything private or local**. Ask rather than assume when it matters, and record the answer — see [[artifact-routing]].

Two things that go wrong without this:

- **The client surface is independent.** A board in one language and a client in another is normal. Never infer the client's language from the project's.
- **Switching mid-artifact is worse than either choice.** A commit message in one language with a body in another, or a task description that drifts halfway through, reads as carelessness regardless of which language was right.

## Not this

- Restating the request before answering it.
- Preamble that announces what you are about to say.
- Padding a short answer to look thorough.
- Summarizing so hard that the reader has to ask a follow-up to act.
