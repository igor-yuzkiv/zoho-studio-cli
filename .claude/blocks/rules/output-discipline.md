---
id: output-discipline
title: Output discipline
kind: rule
binding: mandatory
description: A subagent returns conclusions and pointers, never the material it read.
applies_to: [text, code]
use_when:
  - any subagent returning to the main agent
  - any operation whose result feeds another step
---

# Output discipline

**The point of a subagent is that what it reads does not land in the parent context.** An agent that reads forty files and returns their contents has spent the budget twice and saved nothing.

## Return conclusions and pointers

Point with `file:line`. Quote only the line that actually carries the claim — never the surrounding block "for context", because the reader can open the file and you cannot un-spend the tokens.

Match the shape the operation declares in `produces`. A caller that has to parse prose to find the answer is doing work the subagent was supposed to do.

## Do not narrate the process

What you searched, what you opened, what turned out to be irrelevant — none of it belongs in the output unless it changes what the reader should do next. A dead end is worth one line: what was ruled out, so nobody repeats it.

## Unknowns are part of the result

What you could not determine, and what you deliberately left out of scope, belong in the output. Omitting them reads as coverage, and the caller plans on that.

## Size

If the answer is longer than the question warranted, it is wrong — not too long, wrong. Length signals importance, and inflating it corrupts the signal for everything else in the context.
