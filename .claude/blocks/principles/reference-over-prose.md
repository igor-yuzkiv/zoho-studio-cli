---
id: reference-over-prose
title: Reference over prose
kind: principle
binding: guidance
description: Point at a real file, test, or signature instead of describing the convention in words.
applies_to: [code, text]
use_when:
  - writing a spec, a handoff, or any instruction someone else will execute
  - telling an executor how something should be shaped
skip_when:
  - nothing in the codebase does this yet — then the shape is a decision, not a reference
---

# Reference over prose

**"Follow `app/Services/Payroll/RecalculateTariff.php`" carries more than a paragraph about layering, and costs one line.**

A prose description of a convention is a lossy encoding of a file that already exists. The reader has to reconstruct the original from your summary, and every reader reconstructs it slightly differently. The file does not have that problem.

This matters most for weaker models, which infer far less from abstract description and far more from a concrete example sitting in front of them.

## What makes a good reference

- **A file that already does this correctly** — the closest existing analogue, named by path.
- **A test** — it states the expected behaviour in executable form, and it cannot drift from the code silently.
- **A signature or type** — for a contract, the declaration beats the description of it.

Prefer these over a code block pasted into the document. A pasted block is a copy that goes stale invisibly; a path stays true or fails loudly.

## Name the deviations

A reference without boundaries is read as "copy this". Say what should differ and why: *follow this file's structure and error handling; the validation rules are different because…*

## When there is no reference

If nothing in the codebase does this yet, that is worth knowing on its own — it means the shape is an open decision, not a convention to follow. Say so, and treat it as a decision rather than filling the gap with prose about best practice. See [[decision-authority]].
