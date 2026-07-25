---
paths:
  - "docs/**/*.md"
  - "README.md"
---

# Rule: Documentation

Documentation describes the project as it is today. It grows as features land, one piece at a
time, and never runs ahead of the code.

## Document what exists

Write about behavior that is implemented and works. Nothing else.

Do not write:

- plans, roadmaps, or a feature that is "coming next";
- notes that something is not implemented, not wired up, incomplete, or does not work yet;
- caveats about a limitation that only exists because the work is unfinished;
- TODO markers or placeholder sections waiting to be filled in.

When a feature is half done, document the half that works and stop there. A reader should never
have to sort promises from facts.

The same applies to internals: code that no command uses yet is not documented yet. Describing an
unused helper forces a "but nothing calls it" tail, which is exactly what this rule forbids.

Real limits of shipped behavior are different, and they belong in the document — a destructive
flag, a value that is cached for the process lifetime, a file that must stay out of git. The test
is simple: does this constrain someone using the feature today, or does it merely describe work
that has not happened?

## Keep it current

Documentation changes in the same commit as the behavior it describes.

- Prefer updating an existing document over adding a new one.
- Add a new document when the topic does not belong to any existing one.
- When behavior is removed, remove its documentation instead of marking it obsolete.
- Verify examples against real output rather than writing them from memory.

## Structure

`docs/` is flat. No subfolders.

Every file is numbered in reading order: `<number>-<kebab-case-name>.md`.

```text
docs/
  1-overview.md
  2-settings.md
  3-init-command.md
```

`1-overview.md` is the entry point and links to the rest.

Take the next free number for a new document. Renumber only when the reading order genuinely
changes, since renumbering breaks existing links.

## Style

Bottom line first, plain language, and no sections added for the sake of structure. The KISS
principle in [principles.md](principles.md) applies to prose as much as to code.

- Open with what the thing is and what it is for, in two or three sentences.
- State a critical constraint immediately, not in a note at the bottom.
- Explain the idea in plain words before the precise technical version.
- Use tables only for short lists of facts; explain in prose.
