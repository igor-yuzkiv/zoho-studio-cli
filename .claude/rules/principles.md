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


## Self-documenting code

Prefer **self-documenting code**: the code should explain itself before comments are needed.

The default is no comment. Wanting to write one is usually a signal that a name or the structure
is wrong: rename, introduce an explanatory variable, or extract a function first, and write the
comment only when that does not remove the need for it.

- Prefer intention-revealing names over short or generic ones; a slightly longer name is fine when it aids understanding. Avoid abbreviations unless established in the project domain.
- Introduce explanatory variables and extracted functions when they improve readability.
- Comments explain **why**, not **what** — non-obvious intent, constraints, trade-offs, external behavior, or a decision that would otherwise look strange.
- Preserve existing comments unless they are incorrect or obsolete.

Do not write:

- comments that restate what the code already expresses;
- step-by-step narration of a function body;
- section headers that split a file into labelled blocks;
- doc comments that only repeat the name, parameters, and return type.

A comment earns its place when a reader would otherwise ask "why is this here?" — a workaround for
external behavior, a constraint that is not visible locally, or a deliberate trade-off. Anything
else is noise that goes stale.

```ts
// good
const taskId = options.task

// avoid — restates the code
// Get task id from options
const taskId = options.task

// good — explains a constraint that is not visible here
// bunfig caches the parsed file, so a re-read returns the contents from the first load.
cachedSettings.set(cacheKey, settings)
```
