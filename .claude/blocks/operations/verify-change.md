---
id: verify-change
title: Verify change
kind: operation
description: Run the checks that actually cover the change and report what they showed.
applies_to: [code]
use_when:
  - a change has been made and is about to be reported

requires:
  - the implemented change
  - acceptance criteria or agreed outcome
  - verification commands from the project profile
produces:
  - checks run, with their actual result
  - acceptance criteria met and unmet
  - what could not be verified, and why
completion_criteria:
  - the checks exercised the paths that changed
  - each acceptance criterion is marked met, unmet, or unverifiable
  - failures are reported as failures, not resolved by editing the check

autonomy:
  depth: high
  decisions: none
escalates:
  - a check fails and it is unclear whether the change or the check is wrong
  - the change cannot be verified by any available means

applies_rules:
  - definition-of-done
  - evidence-and-claims
---

# Verify change

## Goal

Establish whether the change does what it was supposed to, and produce the evidence for that claim.

## Steps

1. **Take the commands from the project profile.** Test runner, linter, type checker — the project states its own; do not invent commands or assume a convention.
2. **Target what changed.** Run the checks covering the modified paths first. The full suite only when the change reaches far enough to warrant it.
3. **Walk the acceptance criteria.** Each one is met, unmet, or unverifiable by the available means. Three outcomes, not two.
4. **Check the paths a test would not reach** — behaviour visible only through the UI, in a job, or against real data. Say what you checked manually and what you did not.
5. **Report the result, not a verdict.** What ran, what it said.

## Verification that proves nothing

A green suite that never touches the changed code proves the suite still runs. Before reporting a pass, confirm the checks actually exercise the change — otherwise the report is true and useless at the same time.

## Failures

A failing check means the change is wrong or the check is wrong. Establish which and say so.

Never make a check pass by editing it, unless the check being wrong is the established conclusion — and then that edit is part of the change and gets reported as one.

## Output

```yaml
checks:
  - command: ""
    covers: ""          # which changed paths this actually exercises
    result: ""          # what it reported
acceptance:
  - criterion: ""
    status: met | unmet | unverifiable
    evidence: ""
manual_checks: []       # what was checked by hand, and what was seen
not_verified: []        # what remains unchecked, and why
```
