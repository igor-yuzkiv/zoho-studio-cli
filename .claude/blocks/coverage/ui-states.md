---
id: ui-states
title: UI states
kind: coverage
binding: guidance
description: The interface states that exist in reality and get forgotten in the design — loading, empty, error, forbidden, partial.
applies_to: [code, decisions]
use_when:
  - a page, view, list, form, or component that shows data or accepts input
skip_when:
  - no user interface is involved
questions:
  - Loading — what is shown while the data is on its way?
  - Empty — nothing to show yet. Is it distinguishable from still loading?
  - Error — the request failed. Can the user retry, and does anything explain what happened?
  - Forbidden — the user may not see this. Is the control hidden, disabled, or shown and rejected?
  - Partial — some of the data arrived and some did not.
  - Long — the operation takes fifteen seconds. Is there progress, or does it look frozen?
  - Submitting — is the button disabled, and what happens if it is pressed twice?
  - Stale — data changed elsewhere while this was open.
red_flags:
  - a design shown only with realistic, complete, successful data
  - a list with no empty state
  - a form with no submitting state
  - permission handled by hiding a button and nothing else
escalate_if:
  - the empty state needs copy or an action that has not been decided
---

# UI states

This is a checklist rather than an insight, and that is the point — these are forgotten by recall failure, not by judgement failure.

**Empty versus loading** is the most common single miss: both render as nothing, so a slow request looks like an empty result and the user concludes their data is gone.

**Forbidden** deserves a deliberate answer rather than a default. Hiding a control is fine for noise reduction and useless as security — the check still has to exist on the server, and the two decisions are separate.
