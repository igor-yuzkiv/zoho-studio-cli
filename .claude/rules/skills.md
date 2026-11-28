---
paths:
  - "plugins/**"
  - "plugins-ua/**"
  - ".claude/skills/**"
---

# Rule: Skills

How skills are written — the runtime skills of the plugin in `plugins/claude/zoho-studio/skills/` and the repository's own skills in `.claude/skills/`. The `write-skill` skill applies this rule to a concrete skill.

## Skeleton

The recommended structure is `Goal → Workflow → Rules → Output`. It is a recommendation, not a template: a skill it does not fit gets its own structure, but the principles below apply to every skill.

```markdown
---
name: <kebab-case>
description: <what it does + when to use it: concrete situations and phrases>
allowed-tools: <only when needed>
---

# <Title>

<1–3 sentences: when to use it, what it does not do, what it relies on.>

## Goal
<One sentence: what result counts as reached.>

## Workflow
1. <A step with its completion criterion.>

## Rules
- <A checkable rule — and why.>

## Output
- <What is returned to the user or to another skill.>
```

- **The intro** says when the skill is needed and where it ends, so an agent does not apply it to a neighbouring task.
- **`Goal`** is one sentence the agent checks its result against.
- **`Workflow`** is numbered steps; numbers give stable references ("step 3").
- **`Rules`** are constraints that hold across all steps.
- **`Output`** is what exactly is returned; without it every run answers in its own shape.

Section names are in English in every skill, the Ukrainian mirror included: the structure matches 1:1, only the content is translated.

Optional sections, added only when there is something to say:

| Section | When |
|---|---|
| `When not to use` | The boundary with a similar skill is not obvious |
| `Scale` | The behavior depends on the size of the task |
| `References` | Part of the material lives in `references/*.md`; the pointer says when to read them |

A skill with several modes (by argument) splits `Workflow` into `### <mode>` subsections; `Goal`, `Rules` and `Output` stay shared.

## Principles

1. **The description is the main trigger.** An agent decides whether to call a skill by `name` and `description` alone. The description says what the skill does and when: concrete situations, phrases, neighbouring cases. Write it a little insistently — agents call skills too rarely rather than too often.
2. **A rule with its reason.** Instead of ALWAYS/NEVER — what to do and why. An agent that understands the reason also acts right where the rule did not foresee.
3. **Positively.** A prohibition only for hard limits, and always paired with what to do instead.
4. **Checkable.** For every step and rule one can say whether it was done.
5. **Do not copy the reference.** Options, `--help`, folder layouts go by a link to their source: a copy goes stale.
6. **One value — one place.** A rule shared by several skills lives in one place (a rule, a document, another skill); the others link to it.
7. **Short.** `SKILL.md` up to ~500 lines. More goes to `references/` with a pointer saying when to read it. Delete a sentence the agent would follow without it.

## Skills and `zoho-studio instructions`

What the CLI does, how to write the files it reads, how to read what it writes, and how Zoho behaves where our code depends on it — all of that is in `zoho-studio instructions` (`.claude/rules/instructions.md`), built into the CLI and always matching its version. A skill does not repeat it: it tells the agent to run `zoho-studio instructions <name>` at the step that needs it.

A skill carries what the CLI's code does not: the process of working with the person (when to ask, what to show, what needs approval), knowledge about Zoho the code does not touch (the Deluge language, the REST API, COQL), and maps of first-hand sources (Zoho's documentation, the `crm-oas` OpenAPI spec). When a skill needs a fact about the CLI that `instructions` lacks, add it to `instructions` rather than to the skill.

## The plugin's boundaries

- Skills of the plugin are named in kebab-case without a prefix: Claude Code adds the plugin name (`setup` is called as `/zoho-studio:setup`).
- The plugin is self-contained: a skill reads only files of its plugin (`${CLAUDE_PLUGIN_ROOT}`), never `docs/` or other folders of the clone — installed from git, the plugin may have only its own folder.
- What the skills need on the machine is listed in `plugins/claude/zoho-studio/references/dependencies.md`: for each dependency, how to check it, how to install or update it, and what to tell the person. The rule for keeping it complete is `.claude/rules/dependencies.md`.
- `version` in `plugin.json` equals `version` in the root `package.json` and changes only through `/release` (`.claude/rules/versioning.md`).

## Language

- Runtime skills in `plugins/` are in English, with a Ukrainian mirror in `plugins-ua/` (`.claude/rules/translation.md`).
- The repository's own skills in `.claude/skills/` are in English, like the rest of `.claude/`.
- Code, commands, paths and identifiers are not translated.
