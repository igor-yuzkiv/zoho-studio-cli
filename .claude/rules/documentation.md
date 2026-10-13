---
paths:
  - "docs/**/*.md"
  - "README.md"
  - "README.ua.md"
---

# Rule: Documentation

Applies to `docs/**/*.md`, `README.md`, and `README.ua.md`.

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
- A new command needs a page in `technical/`, an entry in its `1-overview.md`, and an entry in both
  READMEs — in both languages.

## Structure

All documentation exists in two languages with the same files and the same content:

```text
docs/
  en/
    user-guide/   the guide: a task at a time, in plain words
    technical/    the reference: one page per command or topic
  ua/
    user-guide/
    technical/
README.md         English, links to docs/en/
README.ua.md      Ukrainian, links to docs/ua/
```

Each of the four folders is flat — no subfolders — and numbered in reading order:
`<number>-<kebab-case-name>.md`, starting at `1-overview.md`, its entry point. The same page has
the same file name in both languages, and a change to a page is made in both languages in the same
commit. Code, commands, paths, options, and quoted CLI output stay in English in both.

A guide page explains a task and links to the technical page for every option rather than
repeating it. The technical overview links to the guide, and each overview links to its other
language.

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
