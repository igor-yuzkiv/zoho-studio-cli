---
id: backward-compatibility
title: Backward compatibility
kind: coverage
binding: guidance
description: Who already consumes what is being changed, and what breaks for them at the moment of deploy.
applies_to: [code, decisions]
use_when:
  - an API response, request shape, event payload, or stored format changes
  - something is renamed, removed, or made required
  - a default changes
skip_when:
  - the thing being changed has no consumers outside this change
questions:
  - Who consumes this today — clients, integrations, other services, saved links, scripts?
  - What happens to jobs already queued with the old payload when the new code deploys?
  - Are old and new versions live at the same time during rollout?
  - Is this additive, or does it remove or tighten something?
  - Do stored records in the old shape still deserialize?
  - How would we know if an unknown consumer broke?
red_flags:
  - a field renamed rather than added-and-deprecated
  - a queue with in-flight messages and a changed payload shape
  - an optional parameter becoming required
  - a shared library or type used by more than one project
escalate_if:
  - a consumer outside our control has to change
  - compatibility can only be kept by carrying both shapes for a long time
---

# Backward compatibility

The consumers that are found are the ones somebody remembered. The dangerous ones are the quiet kind: a queued job serialized an hour before deploy, a saved URL, a client version still in the field, a nightly script nobody owns.

The rollout window is where this actually bites — for a few minutes, old code and new code run at once and must both work. A change that is only correct after everything has restarted is not compatible, it is lucky.

Cheapest full answer: search for every reference to the name before deciding it is unused.
