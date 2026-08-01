# Task Description Pattern

Use only the sections that help explain the task. Simple tasks should stay simple. A task description is not a novel, even if the bug has character development.

## Title

Answer one question: **what is changing?**

Keep it short, specific, and easy to find later.

Prefer a verb or expected result:

* `Allow managing task owners`
* `Add project documentation editing`
* `Audit backend write operations`

Avoid vague titles like `Task owners` or `Documentation changes`. In a month, nobody will remember what they meant. This is a law of nature, somewhere between gravity and Friday bugs.

## Context

Explain **why the task exists**.

Describe the current situation, the new need, and any larger initiative this task supports.

Do not start with the solution. First explain the situation.

## Problem

Describe what is currently missing, unclear, inconvenient, or incorrect.

Do not confuse the problem with the implementation.

Bad:

> Add a `task_owners` table.

Better:

> There is currently no explicit way to assign responsible users to a task.

This section may be merged into `Context` for small tasks.

## Goal

Describe the result we want after the task is completed.

Write the goal as an outcome, not as a list of implementation steps.

Bad:

> Add an endpoint, table, and modal.

Better:

> A user can assign one or more owners to a task and see them in the task form.

The goal keeps the task under control when someone says, “while we are here, let us also add notifications, analytics, and a small moon landing.”

## Scope

Describe what is included in the task.

Split it into logical blocks when useful:

* Backend
* API
* UI
* CLI
* Validation
* Permissions
* Documentation

Each item should be clear enough to answer: done or not done.

Do not micromanage every method or line of code unless the implementation is part of the contract.

## Out of Scope

Explicitly state what is not included in the current iteration.

This is especially useful for nearby features that are tempting but unnecessary.

Examples:

* Notifications are not part of this task.
* Existing permissions should not be redesigned.
* Other workflows should not be changed.

A task without boundaries eventually becomes “one more small thing.” Small, yes. Like a small fire.

## User Flow

Use this section for UI tasks or multi-step behavior.

Describe the flow from the user’s point of view:

1. The user opens the task form.
2. The user selects one or more owners.
3. The user saves the task.
4. The selected owners remain visible.

Do not describe controllers, requests, or component internals here.

## Rules

Describe business rules as direct statements.

Examples:

* A task may have multiple owners.
* The same user cannot be added twice.
* The owner role is optional.
* Removing the last owner is allowed.

If a rule is not decided, move it to `Open Questions`. Do not hide uncertainty behind “maybe,” “probably,” or “somehow.”

## Technical Notes

Add only technical information that affects the implementation direction or existing contracts.

This may include:

* affected entities or modules;
* expected model relationships;
* existing components to reuse;
* API contracts;
* compatibility requirements;
* architectural constraints.

If a decision is final, state it directly.

If it is only a suggestion, mark it as a recommended approach.

## Acceptance Criteria

Describe observable behavior that proves the task is complete.

Bad:

* Migration created.
* Endpoint added.
* Component implemented.

Better:

* The user can add an owner to a task.
* The user can remove an owner.
* Owners remain visible after saving.
* The same user cannot be added twice.
* Existing tasks without owners still work correctly.

If a criterion cannot be tested, it is probably not an acceptance criterion.

## Edge Cases

List only realistic edge cases close to the feature.

Examples:

* the available users list is empty;
* an assigned user becomes inactive;
* the API returns a validation error;
* the user has no permission;
* the same request is submitted twice.

Do not describe every possible disaster known to humanity.

## Open Questions

Keep unresolved decisions here.

Questions should be specific:

* Is the owner role required or optional?
* Can inactive users remain assigned?
* Who is allowed to manage owners?

Once answered, move the decision into `Scope`, `Rules`, or `Technical Notes`.

## QA Notes

Point out important scenarios and regression risks.

Focus on:

* core user flows;
* permissions;
* validation errors;
* old data;
* affected existing behavior;
* update and delete cases.

QA Notes help testing, but do not replace Acceptance Criteria.

## Future Considerations

Keep ideas that may matter later but are not part of the current scope.

Examples:

* notifications;
* audit history;
* filtering by owner;
* workload statistics;
* automatic assignment.

Future consideration is not a promise. It is just a place to keep the thought without dragging it into the current task.

## Recommended Order

For most tasks:

1. Title
2. Context
3. Problem
4. Goal
5. Scope
6. Out of Scope
7. Acceptance Criteria

Add `User Flow`, `Rules`, `Technical Notes`, `Edge Cases`, `Open Questions`, `QA Notes`, or `Future Considerations` only when they add real value.

## Template

```md
# [Task title]

## Context

[Why this task exists and how the system works now.]

## Problem

[What is currently missing, incorrect, or inconvenient.]

## Goal

[What result should exist after completion.]

## Scope

- [...]
- [...]
- [...]

## Out of Scope

- [...]
- [...]

## User Flow

1. [...]
2. [...]
3. [...]

## Rules

- [...]
- [...]
- [...]

## Technical Notes

- [...]
- [...]
- [...]

## Acceptance Criteria

- [ ] [...]
- [ ] [...]
- [ ] [...]

## Edge Cases

- [...]
- [...]

## Open Questions

- [...]
- [...]

## QA Notes

- [...]
- [...]

## Future Considerations

- [...]
- [...]
```

A good task description should survive a simple test: another developer opens it two weeks later and understands why it exists, what needs to change, and how to verify the result.

If they still need the author to translate it, the task is not documentation. It is an archaeological artifact.
