---
paths:
  - "src/**/*.ts"
---

# Implementation workflow

This workflow applies only to implementation tasks with an understood scope and expected result.

Discovery, product planning, requirement clarification, and task approval belong outside this workflow. When implementation reveals a material gap or contradiction, stop and escalate instead of inventing the missing decision.

Choose the pipeline based on ambiguity, impact, reversibility, and ability to verify the result. File count alone does not determine risk. When multiple classifications apply, use the highest-risk pipeline.

## Pipeline 1: Trivial

Use for obvious, local, low-risk changes that do not alter application behavior, architecture, stored data, or external contracts.

```text
Inspect -> Implement -> Check -> Handoff
```

1. Inspect the nearest relevant context.
2. Make the smallest suitable change.
3. Run the cheapest relevant checks.
4. Provide the handoff.

Typical examples:

* typo and documentation fixes;
* comment corrections;
* safe naming cleanup;
* formatting changes;
* small unambiguous configuration fixes.

## Pipeline 2: Standard

Use for regular features, bug fixes, and refactors when the expected behavior is clear and no Controlled trigger applies.

```text
Explore -> Plan internally -> Implement -> Verify -> Review -> Handoff
```

### Explore

* Read the affected code, callers, contracts, and nearest tests.
* Identify the owning module and follow the current local pattern.
* Inspect the working tree so existing user changes are not mistaken for task changes.

### Plan internally

Determine:

* the intended behavior;
* the affected scope;
* contracts that must remain stable;
* the implementation sequence;
* the required verification.

This is an internal reasoning step and does not require plan approval.

### Implement

* Complete the work within the understood scope.
* Prefer the simplest implementation that matches existing project patterns.
* Add or update tests for bug fixes and behavior changes where practical.
* Resolve routine local decisions independently.
* Avoid unrelated refactoring and speculative abstractions.

### Verify

Run checks proportional to the change:

* targeted tests;
* type checking;
* linting;
* build or command execution;
* focused manual verification where automated coverage is unavailable.

Fix failures caused by the implementation. Run broader checks only when shared behavior or risk justifies them.

### Review

Review the final diff for:

* unrelated changes;
* incorrect or incomplete behavior;
* broken contracts;
* missed edge cases;
* unnecessary complexity;
* missing verification;
* debug code or temporary artifacts.

Use an independent reviewer or review subagent when the size or risk of the change makes a second perspective useful. It is not required for every small implementation.

Fix confirmed in-scope findings and re-run the affected checks.

### Handoff

Report:

* what was implemented;
* important implementation decisions;
* files or areas changed;
* verification performed and its result;
* known limitations, risks, or unresolved findings.

Do not add a final approval checkpoint. The user reviews the resulting diff.

## Pipeline 3: Controlled

Use when implementation reaches a high-impact boundary or requires a material decision that was not resolved before development began.

```text
Explore -> Report decision -> User decision -> Implement -> Verify -> Review -> Handoff
```

Before implementation, report:

* the understood behavior and relevant evidence;
* the missing or conflicting decision;
* the recommended approach;
* meaningful alternatives, when they exist;
* affected scope and contracts;
* risks and assumptions;
* planned verification.

Wait for the user's decision, then continue autonomously unless another Controlled trigger appears.

### Controlled triggers

Use this pipeline when any material condition applies:

* expected behavior or acceptance criteria are ambiguous;
* multiple approaches produce materially different outcomes;
* the change introduces or moves an architectural boundary;
* an API, payload, webhook, file format, or other external contract changes;
* a schema migration, data migration, or risky data operation is required;
* the change crosses multiple integrations with non-local consequences;
* repository behavior contradicts the task or documentation;
* the result cannot be verified with adequate confidence;
* implementation requires material scope expansion;
* a destructive or externally consequential action is required.

Creating migration files may be part of an approved implementation. Running migrations or performing destructive data operations requires separate explicit permission.

## Checkpoints and escalation

Do not stop at routine implementation phases.

Stop only when a material decision or blocked action is encountered:

* scope must expand significantly;
* evidence contradicts the requested behavior;
* a destructive or externally consequential operation is required;
* verification exposes an unresolved product decision;
* an external dependency prevents meaningful progress.

Report:

1. the evidence;
2. the impact;
3. the recommended action;
4. the exact decision or permission required.

After clarification, continue from the current phase and repeat only the affected verification.

## Subagents

Subagents are optional.

Use them when isolated context, specialist analysis, independent verification, or parallel investigation materially improves the result.

Do not use subagents only to satisfy workflow ceremony. The main agent remains responsible for the final implementation, synthesis, and handoff.

## Git and external actions

* Read-only Git inspection is allowed.
* Do not overwrite or revert unrelated user changes.
* Commit and push only after an explicit user request.
* Never perform destructive Git operations.
* Do not create pull requests, publish artifacts, change task status, or communicate externally unless explicitly requested or required by the active Project Office workflow.
