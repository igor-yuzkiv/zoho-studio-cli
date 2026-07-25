# General principles

These principles apply to implementation, investigation, planning, tests, and documentation.

## KISS — keep it simple

- Prefer explicit, readable control flow over clever or generic machinery.
- Reuse an existing abstraction or installed dependency when it fits the current need.
- Add a module or abstraction only when it creates a real boundary, removes meaningful
  duplication, or provides a necessary test seam now.
- Do not add layers, managers, factories, or configuration indirection for hypothetical future use.

## DRY — but not prematurely

- Extract shared code into `shared/` only when it is actually used by 2+ places.
- Duplication of two lines is cheaper than the wrong abstraction. Extract when the third
  occurrence appears or when the duplicated logic encodes a real business rule.

## Investigate before asking

First look for the answer in the request, current code, package scripts, related tests, and
repository documentation. Do not ask the user to decide low-impact technical details already
answered by local evidence or established project patterns.

Ask when the unresolved choice would materially change CLI behavior, remote Zoho data, a public
contract, architecture, or task scope.

## Make the smallest complete change

- Solve the full requested problem with the least unnecessary surface area.
- Preserve existing CLI behavior outside the requested scope.
- Avoid opportunistic cleanup, broad renaming, or unrelated refactoring.
- Decision priority: correctness, scope, consistency, simplicity, maintainability.

## Follow evidence, not assumptions

- Inspect the closest current implementation before selecting a pattern.
- Do not invent Zoho API behavior, authentication flows, or response schemas — verify against
  official docs or actual API responses.
- State consequential assumptions explicitly in plans and handoffs.
