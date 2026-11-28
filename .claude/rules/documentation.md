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

## Structure

Documentation is split by who reads it and why. Every part exists in two languages with the same
files and the same content; the language is the top folder:

```text
docs/
  en/
    README.md        the map: what lives where and where to start
    glossary.md      the terms shared by every part
    guides/          how to use the CLI — for its user, one task at a time
    reference/       what each command and setting does — looked up, not read through
      <group>/       one folder per CLI component, the same groups as `zoho-studio instructions`
    architecture/    how the CLI works inside and why — for whoever changes it
    adr/             decisions that are expensive to reverse, with their reasons
  ua/
    …                the same tree
README.md            English, links to docs/en/
README.ua.md         Ukrainian, links to docs/ua/
```

- **Navigation goes through `README.md`** in `docs/<lang>/` and in each folder: it lists the pages
  in reading order with a line on each. File names carry no numbers — numbering breaks links on
  every insertion.
- File names are kebab-case and the same in both languages. A change to a page is made in both
  languages in the same commit. Code, commands, paths, options, and quoted CLI output stay in
  English in both.
- **Guides** explain a task in plain words and link to the reference for every option rather than
  repeating it.
- **Reference** has a page per command or topic. `reference/README.md` lists every command by
  group.
- **Architecture** explains how a part of the CLI works and why it is built that way. It is
  written when an area is touched, not ahead of time. Code rules for agents stay in
  `.claude/rules/architecture.md`; this part explains, it does not prescribe.
- **ADR** — see below.

A new command needs a reference page, an entry in `reference/README.md`, and an entry in both
READMEs — in both languages, in the same change as the command.

## Document what exists

Write about behavior that is implemented and works. Nothing else.

Do not write plans, roadmaps, or a feature that is "coming next"; notes that something is not
implemented or does not work yet; caveats about a limitation that exists only because the work is
unfinished; TODO markers or placeholder sections. When a feature is half done, document the half
that works and stop there.

Real limits of shipped behavior are different and belong in the document — a destructive flag, a
value cached for the process lifetime, a file that must stay out of git. The test: does this
constrain someone using the feature today, or does it merely describe work that has not happened?

## Keep it current

Documentation changes in the same commit as the behavior it describes.

- Prefer updating an existing page over adding a new one; one topic lives in one place, others link
  to it.
- When behavior is removed, remove its documentation instead of marking it obsolete.
- Verify examples against real output rather than writing them from memory.
- No conversation history, task keys, or local paths: a page is understood without them.

## ADR

An ADR records a decision that is expensive or hard to reverse — a contract, a data or file format,
where files live that user projects depend on, the way the tool is installed — or one with real
alternatives whose reason is worth remembering. A decision that is easy to undo, or an
implementation detail, needs no ADR.

- File `adr/NNNN-<topic>.md`, a four-digit number in order; numbers are never reused.
- Format: Decision → Context → Alternatives → Consequences → Limits, with a status and a date.
  `adr/README.md` holds the template and the table of decisions.
- An ADR is not rewritten after it is accepted; only its status changes ("superseded by 0007").
- An ADR is added only with the user's agreement — the `adr-discipline` skill.

## Writing

The goal is a page that is clear, simple to read, and unambiguous.

### The first paragraph

Right after the H1 comes a paragraph of one or two sentences: what this is and what it is for. No
lead-in like "this document describes…". From it a reader — a person or an agent — knows at once
whether this is the page they need, and one who stops there knows the essentials.

### Sentences

- **Bottom line first.** The main point, then the details. A critical constraint goes up front,
  not into a note at the bottom.
- **Full sentences, no dropped words.**
- **One thought — one sentence.** A long sentence with several conditions is split.
- **A condition is a full sentence.** Not "and if X — Y", but "If X, the CLI does Y."
- **State facts.** "The CLI writes the file", not "should write" or "will write".
- **Ask of every sentence: what does this mean for the reader?** If the sentence itself does not
  answer, rewrite it.
- **Plain words before the precise technical version.**

### Terms and names

- **A defined term stays the same word** to the end of the page; shared terms live in
  `glossary.md`.
- **Ukrainian where it reads unambiguously**; a technical term stays in English (pull, deploy,
  module, field) when its Ukrainian counterpart is ambiguous.
- **Commands, options, file names, UI labels, and CLI messages** are quoted exactly as they appear,
  in `code`.

### Values

- **Concrete numbers with units.** Range boundaries are stated explicitly: whether each end is
  included.
- **A value fixed in the code** is described as fixed, not as "configurable".

### Explaining

- **A non-obvious rule gets its reason next to it** — not only what, but why.
- **A rule with a threshold, date, or format gets an example:** a real command and its real output.
- **A rare case is marked as rare**, so the reader does not take it for the usual one.
- **What is not covered is said explicitly:** "pull fetches metadata, not CRM records."

### By part

- **Guides** follow the user's path: what you need first → the steps, each with a real command →
  how to check the result.
- **Architecture** draws the data flow as a mermaid diagram where it helps to understand it.

### Formatting

- **One paragraph — one line**, no manual line breaks.
- **Lists for any enumeration**; logic is explained in connected prose, not as facts separated by
  commas.
- **Tables only for short lists of facts.**

## Before showing a page to a person

- [ ] Every value, option, and default is checked against the current code; what is not checked
      is marked in the text.
- [ ] The first paragraph says what this is and what it is for.
- [ ] Terms are used consistently; commands and messages are quoted exactly.
- [ ] Non-obvious rules have a "why"; rules with limits have an example with real output.
- [ ] Rare cases are marked as rare; what is not covered is said.
- [ ] No "and if X — Y", no dropped words, no history of changes.
- [ ] Both languages say the same.
