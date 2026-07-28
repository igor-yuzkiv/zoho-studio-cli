---
id: definition-of-done
title: Definition of done
kind: rule
binding: mandatory
description: Done means verified and reported, not written. Unverified work is a proposal.
applies_to: [code]
use_when:
  - reporting the result of any change
---

# Definition of done

**Written is not done. Done is verified, and the verification is shown.**

## Verify what you changed

Run the checks that actually cover the change — the project profile lists the commands. Targeted first; the full suite only when the change reaches far enough to warrant it.

Verification that exercises none of the changed paths is theatre. A green suite that never touches your code proves the suite still runs, nothing more.

## Report what you ran

Name the checks and what they showed. "Tests pass" is not a report — *which* tests, and what they cover, is.

If nothing could be verified, say that plainly and say why. An unverified change is a proposal about what will probably work, and it should be labelled as one.

## Partial is reported as partial

Every item of scope is either done, or listed as not done with the reason. A summary that quietly omits the third of five items is worse than one that admits it, because it costs the reader the chance to notice.

## Failing tests

A failing test means either the change is wrong or the test is wrong. Which one it is must be established and stated — never assumed, and never resolved by editing the test into agreement.

Changing a test so that it passes, without saying so, disables the alarm and reports the fire extinguished.
