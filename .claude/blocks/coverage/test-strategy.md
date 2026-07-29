---
id: test-strategy
title: Test strategy
kind: coverage
binding: guidance
description: Which scenarios are checked and at which level — decided before the code exists, not after.
applies_to: [code, decisions]
use_when:
  - planning any change large enough to have more than one behaviour
skip_when:
  - the project has no tests and adding the first one is out of scope
questions:
  - Which scenarios must pass for this to be considered correct?
  - Which of them are cheap at unit level, and which genuinely need integration?
  - What would a regression here look like, and is that specific case covered?
  - Are the failure paths tested, or only the happy one?
  - Is there an existing test that should now fail, meaning behaviour changed on purpose?
  - What is verified by hand because automating it is not worth it — and is that written down?
red_flags:
  - tests written after the implementation, asserting what the code happens to do
  - only the happy path covered
  - a bug fix with no test reproducing the bug
  - heavy mocking that leaves the real integration unexercised
escalate_if:
  - correctness cannot be verified without production data or a live third party
---

# Test strategy

Deciding this **before** implementation is the whole point. A test matrix written afterwards tends to describe what the code does rather than what it should do — it locks in the behaviour, including the parts that are wrong.

Two questions carry most of the value:

**What would a regression look like?** That names the test that actually protects something, as opposed to the ones that raise the coverage number.

**What is checked by hand?** Manual verification is legitimate — undocumented manual verification is how a step gets skipped on the third release and nobody remembers it existed.
