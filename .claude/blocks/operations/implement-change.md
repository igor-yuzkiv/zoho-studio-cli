---
id: implement-change
title: Implement change
kind: operation
description: Apply a specified change to the codebase, following the project's existing patterns.
applies_to: [code]
use_when:
  - the change is specified well enough that no design decision remains open
skip_when:
  - the approach is still undecided — the work belongs in a concept or spec step first

requires:
  - agreed scope (task spec, or an outcome and boundaries agreed in conversation)
  - context map — entry points and affected components with file:line
  - exemplar — an existing file that already does something of this shape
produces:
  - code diff
  - deviations — where the implementation departs from the spec, and why
  - surfaced issues — adjacent problems found and deliberately not fixed
  - open questions — anything that stopped the work
completion_criteria:
  - every item in the agreed scope is either implemented or explicitly reported as not implemented
  - nothing outside the agreed scope was modified
  - the change follows the exemplar, or every departure from it is named
  - no decision was made that belonged to the requester

autonomy:
  depth: high
  decisions: none
escalates:
  - the outcome is unreachable within the agreed scope
  - the spec is silent on a choice that changes observable behaviour
  - the change would break an existing caller, contract, or stored data
  - no exemplar exists and the structural choice has lasting consequences

applies_rules:
  - execution-discipline
  - reference-over-prose
  - evidence-and-claims
  - definition-of-done
applies_principles:
  - kiss
  - yagni
  - chestertons-fence
  - self-documenting-code
---

# Implement change

## Goal

Turn an agreed specification into working code that looks like it was always part of this project.

This operation does not design. If a design decision is still open when you reach it, that is an escalation, not a judgement call.

## Steps

1. **Re-read the scope.** Note what is explicitly excluded. Excluded items are boundaries, not suggestions.
2. **Open the exemplar first, in full, in this context.** Read it before writing anything. Structure, naming, layering, and error handling come from there, not from general best practice.

   Do not delegate this to a subagent. A summary of an exemplar is useless for writing code shaped like it — you need the text. Reading two named files deliberately is cheap; it is reading forty blind that context hygiene exists to prevent.
3. **Confirm the context map is still true.** File paths and entry points get stale. Verify the ones you are about to touch actually exist and do what the map says.
4. **Make the change.** Smallest diff that reaches the outcome. No incidental cleanup.
5. **Note every departure** from the spec or the exemplar as you go, with the reason. Do not reconstruct these afterwards from memory.
6. **Collect adjacent findings** without fixing them.

## Do not

- Do not decide anything the spec left open — escalate instead.
- Do not add abstraction for a use case that does not exist yet.
- Do not remove or bypass code whose purpose you have not established.
- Do not adjust tests so that they pass. If a test fails, either the change is wrong or the test is wrong, and which one it is must be stated, not assumed.
- Do not report the work as done while any scope item is unimplemented.

## Output

```yaml
implemented: []          # scope items completed
not_implemented: []      # scope items not completed, each with the reason
files_changed: []        # path — one line on what changed and why
deviations: []           # departure from spec or exemplar — with rationale
surfaced_issues: []      # file:line — what it is, why it matters, left unfixed
open_questions: []       # anything that stopped or constrained the work
```

Keep it compressed. This output is read by a person deciding what to do next, not by someone who wants the diff narrated back to them.
