---
name: write-skill
description: Writes or reworks a skill of zoho-studio by .claude/rules/skills.md — a runtime skill of the plugin in plugins/claude/zoho-studio/skills/ with its Ukrainian mirror, or a skill of this repository in .claude/skills/. Use when the user asks to create, port, rewrite or restructure a skill, even if they do not mention the structure.
---

# Write skill

The skeleton, the optional sections and the principles of a skill live in `.claude/rules/skills.md` — the single source, not repeated here. This skill says how to apply them to a concrete skill.

## Goal

The skill follows `.claude/rules/skills.md`, lives in the right place, and the user has read and approved its text.

## Workflow

1. **Read `.claude/rules/skills.md`.** Done when you know the skeleton, the principles, and the boundary between a skill and `zoho-studio instructions`.
2. **Decide where the skill lives.** A runtime skill — `plugins/claude/zoho-studio/skills/<name>/SKILL.md`, in English, with a mirror in `plugins-ua/` by `.claude/rules/translation.md`. A repository skill — `.claude/skills/<name>/SKILL.md`, in English. Done when the path and the language are known.
3. **Gather the content.** For a port — read the source and settle with the user what stays and what changes. For a new skill — find out what it should do, when it should trigger, and what it returns. Check what `zoho-studio instructions` already covers: the skill points to it instead of repeating it, and a missing CLI fact goes into `instructions`. Done when you can write `Goal` in one sentence.
4. **Write the skill by the skeleton.** Depart from it only when it does not fit, and tell the user why. Done when every section of the skeleton is either filled or deliberately left out.
5. **Hand it for review.** The user reads the skill's text in Plannotator, not in chat: a skill is long and comments go to particular places. For a runtime skill, the language the user asked for goes first (often Ukrainian); the other one after approval. Done when the user approved the text.
6. **Offer test runs** through `skill-creator` when the skill's result can be checked. Run them only with the user's agreement.

## Rules

- Do not change `version` in `plugin.json` — it changes only through `/release`.
- The mirror in `plugins-ua/` is updated in the same change as the English skill; when the user deliberately reviews one language first, say that the other is not synced yet.
- A rule shared by several skills is not copied into a skill — link to where it lives.

## Output

- The path to the skill (and its mirror, if any).
- How the skill departs from the skeleton and why — if it does.
- What is left: the other language, test runs, tuning the description.
