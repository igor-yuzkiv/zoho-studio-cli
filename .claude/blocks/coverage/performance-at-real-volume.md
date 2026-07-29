---
id: performance-at-real-volume
title: Performance at real volume
kind: coverage
binding: guidance
description: Whether this still works when the data is the size it actually is, not the size it is in development.
applies_to: [code, decisions]
use_when:
  - a list, report, export, import, or anything iterating over records
  - a query inside a loop, or a loop inside a request
skip_when:
  - the operation touches a bounded, genuinely small set
questions:
  - How many rows does this touch in production today? In a year?
  - Is there a query inside a loop, or a lazy relation loaded per item?
  - Is the result set bounded — pagination, a limit, a date range?
  - Is anything loaded fully into memory that has no upper size?
  - Does a long operation run inside the request, or in a job?
  - Which columns does this filter and sort by, and are they indexed?
red_flags:
  - N+1 — a relation accessed inside an iteration
  - an export or report generated synchronously
  - a query with no limit on a table that grows
  - a development database with a few dozen rows
escalate_if:
  - meeting the requirement needs a structural change — denormalization, caching, a different store
---

# Performance at real volume

Almost everything in this category is invisible in development, because the development database is small enough that a hundred extra queries take nine milliseconds.

The single highest-yield question is **how many rows does this actually touch** — asked as a number, from production, not as an impression. Most of the rest follows from the answer.

Second: **does this run inside the request?** Report generation, export, and bulk import are the recurring three, and the answer is usually that they should not.
