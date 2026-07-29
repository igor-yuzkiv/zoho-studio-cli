---
id: edge-cases-and-data-variants
title: Edge cases and data variants
kind: coverage
binding: guidance
description: The shapes of input that exist in reality but not in the example everyone reasoned from.
applies_to: [code, decisions]
use_when:
  - any logic that processes user data, imported data, or historical records
skip_when:
  - the input space is genuinely closed and fully enumerated
questions:
  - Empty — no rows, no items, a blank string. What is shown?
  - One. Many. Far more than expected.
  - Zero, negative, and null where a number is expected.
  - Duplicates — same name, same key, same content. Are they allowed?
  - Very long values, unusual characters, other alphabets, emoji.
  - Different currency, timezone, locale, date format.
  - Partially filled records — created before some field existed or became required.
  - Deleted or archived related records the row still points at.
red_flags:
  - reasoning throughout on one tidy example
  - uniqueness assumed but not enforced anywhere
  - dates handled without stating which timezone they are in
  - a list rendered with no empty state described
escalate_if:
  - a real data shape contradicts a stated requirement
---

# Edge cases and data variants

The list above is deliberately mechanical, because this is a recall task, not a judgement one. Walking it takes two minutes and reliably produces two or three real cases.

The most productive question of the set is **duplicates**. Names are assumed unique far more often than they are unique, and the assumption is invisible until real data arrives — which is exactly how `workflows:pull` found two rules with the same name in one module on the first live run.

Where a variant matters, it belongs in the acceptance criteria, not only in a test.
