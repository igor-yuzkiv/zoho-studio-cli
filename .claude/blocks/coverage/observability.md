---
id: observability
title: Observability
kind: coverage
binding: guidance
description: How anyone finds out that this works, or has stopped working, once it is in production.
applies_to: [code, decisions]
use_when:
  - a background job, integration, scheduled task, or anything that runs unattended
  - a path that can fail without a user noticing immediately
skip_when:
  - a synchronous user-facing action whose failure the user sees instantly
questions:
  - If this silently stops working, who notices, and after how long?
  - What is logged on failure — enough to identify which record and why?
  - Is there a signal that it ran at all, or only one that it failed?
  - For a scheduled job: how do we know it did not simply stop being scheduled?
  - Are logs at a level that will actually be kept and searchable?
  - Does anything here need a metric, or is a log enough?
red_flags:
  - a nightly job with no record of the last successful run
  - an integration whose failures are caught and logged at debug level
  - logs that say an operation failed but not for which record
  - a new code path with no logging at all
escalate_if:
  - a silent failure would have financial or data-integrity consequences
---

# Observability

The question is not "should we add logging". It is **how long could this be broken before anyone noticed** — and if the honest answer is weeks, that is the finding.

Unattended work is where this matters: a user-facing button that breaks generates a support ticket within the hour, a nightly sync that stops generates nothing at all.

Two things are usually missing and both are cheap: a record that the run *succeeded* (absence of failure is not evidence of success), and enough context in the failure log to identify the specific record without reproducing the problem.
