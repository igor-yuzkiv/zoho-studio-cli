---
id: error-behavior
title: Error behaviour
kind: coverage
binding: guidance
description: What the user sees and what the system does when this fails — stated per failure, not as "handle errors".
applies_to: [code, decisions]
use_when:
  - the work calls anything that can fail: network, database, filesystem, queue, third party
  - a multi-step operation can fail partway
skip_when:
  - the change cannot fail in any way the caller would notice
questions:
  - What are the actual failure modes here — not "an error", but which ones?
  - For each, what does the user see, and can they do something about it?
  - Is the operation retried? Automatically, or by the user? Is retrying safe?
  - If it fails halfway, what state is left behind — partial writes, orphaned records?
  - Is the failure logged with enough context to identify the record and the cause?
  - Does a failure here block the user, or degrade quietly?
red_flags:
  - a catch block that logs and continues
  - an error message that shows the raw exception to a user
  - a multi-step write with no transaction and no cleanup
  - a case whose plan is that it should not happen
escalate_if:
  - the right behaviour on failure is a product decision — block, degrade, or queue for later
---

# Error behaviour

"Handle errors" is not a requirement, it is a placeholder. The question is per failure and has three parts: **what the user sees, what the system keeps, and what happens next.**

The half-completed case is the one that is skipped and the one that costs most. A record created, its related rows not, and no error surfaced — that state is now in the database, and it is discovered weeks later by someone reading a support ticket.

Also worth separating: a failure the user can act on (bad input, missing permission) and one they cannot (the third party is down). They deserve different messages and often different logging.
