---
id: review-change
title: Review change
kind: operation
description: Review the diff against the task it was meant to accomplish, with evidence for every finding.
applies_to: [code]
use_when:
  - a change is complete and about to be delivered
  - an independent read of a diff is wanted at any point

requires:
  - the diff
  - the task scope and acceptance criteria
produces:
  - findings with severity, evidence, impact, recommendation
  - blockers separated from optional improvements
completion_criteria:
  - every finding points at a line in the diff or a concrete consequence
  - findings are judged against the task, not against personal preference
  - the review states plainly when it found nothing blocking

autonomy:
  depth: high
  decisions: none
escalates:
  - the change appears to solve a different problem than the task states

applies_rules:
  - evidence-and-claims
  - execution-discipline
applies_principles:
  - yagni
  - chestertons-fence
  - self-documenting-code
---

# Review change

## Goal

Find real problems in a change, without redesigning the system on the way past.

## What to review against

The task and its acceptance criteria — first, and mostly. A change that is elegant and does not do what was asked is a worse outcome than the reverse.

Then, in order of what actually costs money later: correctness on the paths that changed, data integrity, permissions, behaviour on failure, compatibility with existing callers, and whether the diff stayed inside its scope.

## Severity, honestly

- **blocker** — wrong result, data loss, broken caller, security hole, scope the task did not authorize.
- **major** — will cause a defect under conditions that will occur.
- **minor** — real but survivable.
- **observation** — noticed, unproven, or a matter of taste. Reported as such.

**Naming is not a blocker.** Neither is formatting, nor a structure you would have written differently. Marking preference as severity is the fastest way to make a review ignorable.

## Rules that keep review from becoming noise

- **No evidence, no defect.** A finding that cannot point at a line or name a concrete consequence is an observation — see [[evidence-and-claims]].
- **No speculative abstraction.** "This should be more extensible" needs a named second use case, or it is preference — see [[yagni]].
- **Do not demand removal of what you have not understood** — see [[chestertons-fence]].
- **Do not review the code that was already there.** Pre-existing problems adjacent to the diff are worth reporting separately, not charged to this change.
- **Say when it is fine.** A review that always finds something teaches the reader that findings are decoration.

## Two passes before you report

Findings are drafted under momentum, and momentum inflates. Both passes run over the draft, not instead of it.

### Self-audit

For every finding at blocker or major, answer three questions:

1. **Confidence** — high, medium, or low.
2. **Could the author refute this immediately** with context you might not have?
3. **Is this a flaw or a preference?**

Then apply: low confidence moves to open questions. Refutable with no hard evidence moves to open questions. Preference is downgraded to observation or dropped.

### Realist check

For every blocker and major that survived, pressure-test the severity itself:

1. What is the **realistic** worst case — not the theoretical maximum, what would actually happen?
2. What mitigating factors exist that this review is ignoring — existing tests, deploy gates, monitoring, feature flags, low traffic on the path?
3. How fast would this be detected in practice — immediately, within hours, or silently?
4. **Am I inflating this because I found momentum during the review?**

Downgrade when the realistic worst case is a minor inconvenience with easy rollback, or when mitigations substantially contain the blast radius.

Two constraints on downgrading:

- **Every downgrade states what mitigates it.** "Mitigated by: endpoint handles under 1% of traffic and has upstream retry." No rationale, no downgrade.
- **Never downgrade data loss, a security hole, or financial impact.** Those earn their severity regardless of how unlikely they look.

Report any recalibration. A finding that survives all four questions at its original severity is correctly rated — say that too.

## Output

```yaml
verdict: blocking | non-blocking
findings:
  - severity: blocker | major | minor | observation
    category: ""
    statement: ""       # what is wrong, in one sentence
    evidence: ""        # file:line in the diff, or the concrete consequence
    impact: ""          # what happens if it ships
    recommendation: ""
    confidence: high | medium
    mitigated_by: ""    # only when severity was downgraded
pre_existing: []        # problems next to the diff, not caused by it
scope_check: ""         # did the change stay inside what was asked
open_questions: []      # low-confidence or refutable, moved here by self-audit
recalibrated: []        # what changed severity in the realist check, and why
```
