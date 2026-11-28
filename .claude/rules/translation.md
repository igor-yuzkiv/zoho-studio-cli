---
paths:
  - "plugins/**"
  - "plugins-ua/**"
---

# Rule: Translation of the plugin

- Every skill, prompt and instruction in `plugins/` has a Ukrainian mirror at the same relative path in `plugins-ua/`, so the person can proofread every instruction in their language.
- The exception is evals (`plugins/claude/<plugin>/evals/`): they are tests, not instructions to an agent, so they have no mirror.
- Every change of a file in `plugins/` updates its mirror in the same change.
- A new, deleted or moved file is created, deleted or moved in the mirror as well.
- The translation keeps the same content, structure and strictness, without shortening or adding.
- Code, commands, paths and identifiers are not translated; section names of a skill stay in English (`.claude/rules/skills.md`).
- The source of truth is `plugins/`; only it is loaded by Claude Code. When the two versions differ, say so instead of guessing which is right.
