# CLAUDE.md

- Guidance for Claude Code (claude.ai/code) when working in this repository.
- Local environment-specific instructions may be defined in CLAUDE.local.md.
- This project uses a project office — for its tasks and documentation, see .project-office/AGENTS.md.

## Project

Zoho Studio CLI is a developer-focused command-line tool for working with Zoho platform resources, configuration, metadata, and code.

The project aims to bring Zoho development closer to conventional software engineering workflows by representing remote resources in a structured, local, and automation-friendly form.

It is designed for both developers and AI agents, providing a predictable interface for inspecting, managing, and processing Zoho project artifacts through scripts, development tools, and agent-driven workflows.

## Project Rules

- [architecture.md](.claude/rules/architecture.md) — project architecture, code style, CLI conventions
- [documentation.md](.claude/rules/documentation.md) — writing and structuring `docs/`
- [git.md](.claude/rules/git.md) — commits and other git work

How work is carried out — sizing, verification, review, closing — is not a project rule here; it
comes from the pipeline below.

<!-- composable-pipeline:begin -->
## How work is done here

These rules are **binding** — they apply to every task in this repository, with or without a
command. Each line below is the rule. Open the matching block in `.claude/blocks/rules/` when the
line is not enough to decide.

- **execution-discipline** — do exactly what the task specifies. Minimal diff. Report adjacent
  problems instead of fixing them.
- **decision-authority** — depth is granted, decisions are not. Silence in the task is not
  permission; escalate with options and a recommendation, then continue with what does not depend
  on the answer.
- **definition-of-done** — done means verified and reported. Name which checks ran and what they
  showed. Partial work is reported as partial.
- **evidence-and-claims** — separate verified from inferred and mark which. A claim about code
  carries a `file:line` that was actually opened.
- **output-discipline** — subagents return conclusions and pointers, never the material they read.
- **communication-defaults** — lead with the conclusion, name uncertainty plainly, use the language
  the profile sets for that surface.
- **artifact-routing** — destinations come from the profile. Never guess one; ask once and record it.

Guidance principles are in `.claude/blocks/principles/` — `kiss`, `yagni`, `dry`,
`chestertons-fence`, `reference-over-prose`, `bluf`, `eli5`, `plain-language`. Applied by
judgement, not by rote.

**To execute a task:** follow `.claude/blocks/pipelines/run-task.md`. Pick the lane before
anything else; when unsure, take the lighter one. `/cp-run-task` invokes it explicitly; the skill
also triggers on its own when a request looks like a task.

The trigger is **the move from discussing to changing code** — not the wording of the request.
"Go ahead", "let's do it", or a nod at the end of a long planning conversation all start the
cycle, exactly as a formally stated task would. State the lane in one line before the first edit,
so the choice is visible and correctable. For the direct lane that line is the whole ceremony.

**Orienting** splits in two, and conflating them is the usual mistake. *Where does this live and
what will it affect* → `code-explorer` subagent, several in parallel with narrow scopes, returns a
map. *What shape should the new code take* → read the exemplar named in the profile **directly**,
here, in full. A map cannot carry the text you need to write a file like it.

**To review:** `/cp-review`, or the `code-reviewer` subagent — reports, never fixes.

**Project facts** — artifact destinations, exemplars, verification commands, language per surface —
are in `.claude/project-profile.yml`. Read it rather than guessing.
<!-- composable-pipeline:end -->

## Commands

```bash
bun install             # dependencies
bun run dev -- --help   # run CLI from source
bun run lint            # eslint
bun run typecheck       # tsc --noEmit
bun test                # tests
bun run check           # lint + typecheck + tests
bun run build           # bun-targeted bundle → dist/
bun run compile         # standalone executable → dist/
```

## Stack

The project is built as a Bun-based TypeScript CLI application using ECMAScript modules.

Core technologies:

* **Bun** — runtime, package manager, development runner, and build tool.
* **TypeScript 5** — primary programming language with static type checking.
* **Commander.js** — command definition, argument parsing, and CLI structure.
* **@inquirer/prompts** — interactive terminal prompts.
* **Axios** — HTTP client for communication with Zoho APIs and other remote services.
* **bunfig** — project-level configuration loading and management.

Development tooling:

* **ESLint 10** — code quality and static analysis.
* **typescript-eslint** — TypeScript support for ESLint.
* **Prettier 3** — code formatting.
* **Jiti** — runtime loading of TypeScript and modern JavaScript configuration files.