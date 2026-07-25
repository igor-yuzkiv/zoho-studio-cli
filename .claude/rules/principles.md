# General principles

These principles apply to implementation, investigation, planning, tests, and documentation.

## KISS — keep it simple / simple-first

- Prefer explicit, readable control flow over clever or generic machinery.
- Reuse an existing abstraction or installed dependency when it fits the current need.
- Add a module or abstraction only when it creates a real boundary, removes meaningful
  duplication, or provides a necessary test seam now.
- Do not add layers, managers, factories, or configuration indirection for hypothetical future use.

## Change strategy

Prefer minimal, surgical changes:

- default to the smallest change that solves the requested problem;
- preserve existing architecture, patterns, naming, and conventions unless the task explicitly requests refactoring;
- avoid opportunistic cleanup or unrelated "while I am here" refactors;
- minimize file count, diff size, and blast radius;
- prefer extending existing abstractions before introducing new layers;
- when larger refactoring seems beneficial, propose it separately instead of doing it automatically;
- do not silently expand scope after an approved plan or reviewed artifact.