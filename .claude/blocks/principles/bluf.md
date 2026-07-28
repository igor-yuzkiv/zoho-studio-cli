---
id: bluf
title: BLUF — bottom line up front
kind: principle
binding: guidance
description: Lead with the conclusion, decision, or request. Context and evidence follow.
applies_to: [text, chat, client-communication]
use_when:
  - status updates and progress reports
  - findings from an investigation
  - proposals and recommendations
  - documents written to get a decision
  - task comments and handoffs
  - any answer longer than a few sentences
skip_when:
  - the conclusion only makes sense after a specific piece of context
  - narrative order is the point, as in a reproduction sequence or a timeline
---

# BLUF — bottom line up front

**Put the main conclusion first. Everything that supports it comes after.**

The reader should learn what happened, what is proposed, and what is needed from them without reading to the end.

## Structure

1. **Bottom line** — the decision, result, recommendation, or request.
2. **Context** — briefly, what the situation is.
3. **Support** — facts, checks, evidence.
4. **Risks and limits** — what is uncertain or constrained.
5. **Next step** — what happens now, and who does it.

Not every part is required. Adapt to the document.

## Before writing, answer

- What is the single most important thing here?
- What decision or action is expected from the reader?
- Which conclusion stays true even if every technical detail is cut?

Then put that at the top.

## The bottom line must be

- specific — a result, not a topic;
- self-contained — understandable with no prior context;
- honest about uncertainty.

If no decision has been reached, say so directly rather than implying one:

> No final decision yet. Recommended option is to normalize the historical snapshots in a separate one-off process.

## Avoid

- opening with the history of the problem;
- burying the conclusion at the end;
- presenting evidence before explaining what it means;
- vague phrasing that names a topic instead of a result;
- hiding risk or uncertainty behind a confident tone;
- repeating the same conclusion in every section;
- cutting so hard that necessary context is lost.

## Example

**Without BLUF.** We checked the logs, compared behaviour across environments, and reproduced the issue on a test quota. It turned out that changing the participant count does not trigger a price recalculation. The cause is a manual lock on the line item.

**With BLUF.** *The price does not recalculate because the line item is manually locked.* Confirmed by log inspection and by reproducing the issue on a test quota. Removing the lock makes the tariff recalculate correctly.

## Note

BLUF governs the **order** in which information is presented, not how much of it there is. It is not an instruction to shorten. Technical and product detail stays — it just stops coming first.
