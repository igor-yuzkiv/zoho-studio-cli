---
paths:
  - "docs/**/*.md"
  - "README.md"
---

# Rule: Documentation

Applies to `docs/**/*.md` and `README.md`.

Documentation describes the project as it is today. It grows as features land, one piece at a
time, and never runs ahead of the code.

## Document what exists

Write about behavior that is implemented and works. Nothing else.

Do not write plans, roadmaps, or a feature that is "coming next"; notes that something is not
implemented or does not work yet; caveats about a limitation that exists only because the work is
unfinished; TODO markers or placeholder sections. When a feature is half done, document the half
that works and stop there.

The same applies to internals: code that no command uses yet is not documented yet.

Real limits of shipped behavior are different and belong in the document — a destructive flag, a
value cached for the process lifetime, a file that must stay out of git. The test: does this
constrain someone using the feature today, or does it merely describe work that has not happened?

## Keep it current

Documentation changes in the same commit as the behavior it describes.

- Prefer updating an existing document over adding a new one.
- When behavior is removed, remove its documentation instead of marking it obsolete.
- Verify examples against real output rather than writing them from memory.
- A new command needs a page in `docs/`, an entry in `1-overview.md`, and an entry in `README.md`.

## Structure

`docs/` is flat. No subfolders. Every file is numbered in reading order:
`<number>-<kebab-case-name>.md`, starting at `1-overview.md`, which is the entry point and links
to the rest.

Take the next free number for a new document. Renumber only when the reading order genuinely
changes, since renumbering breaks existing links.

## Style

Bottom line first, plain language, no sections added for the sake of structure — see
`.claude/blocks/principles/bluf.md` and `.claude/blocks/principles/plain-language.md`, which apply
to prose as much as to anything else.

- Open with what the thing is and what it is for, in two or three sentences.
- State a critical constraint immediately, not in a note at the bottom.
- Explain the idea in plain words before the precise technical version.
- Use tables only for short lists of facts; explain in prose.
