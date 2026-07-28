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

## Agent configuration

Work is executed through the pipeline in `.claude/blocks/pipelines/run-task.md` — orient, size
the ceremony, implement, verify, review, close. Read it before starting a task, not after.

Project-specific addresses, exemplars, and verification commands live in
`.claude/project-profile.yml`. Never guess one of those — read the profile, and if the answer is
not there, ask once and write it in.

### Entry points

| Invoke | For |
|---|---|
| `/task <description>` | run a piece of work through the full cycle |
| `/review [target]` | independent review of a diff, delegated to `code-reviewer` |
| `run-task` skill | same cycle, when picked up without the command |
| `code-explorer` subagent | map code before changing it — several in parallel, narrow scopes |
| `code-reviewer` subagent | review a finished diff; reports, never fixes |

### Rules — `.claude/blocks/rules/`, mandatory

| Block | |
|---|---|
| `execution-discipline` | do what the task specifies; report adjacent problems instead of fixing them |
| `decision-authority` | depth is granted, decisions are not — escalate rather than choose |
| `definition-of-done` | done means verified and reported; unverified work is a proposal |
| `evidence-and-claims` | separate what was verified from what was inferred, and mark which |
| `output-discipline` | a subagent returns conclusions and `file:line`, never the material it read |
| `communication-defaults` | anything a human reads leads with the conclusion and names its uncertainty |
| `artifact-routing` | destinations come from the profile, never from the catalog |

### Principles — `.claude/blocks/principles/`, guidance

`kiss` simplest sufficient solution · `yagni` build the requirement you have · `dry` one home per
fact, link elsewhere · `chestertons-fence` do not remove what you do not understand ·
`reference-over-prose` point at a real file instead of describing it · `bluf` conclusion first ·
`eli5` ordinary language · `plain-language` describe behaviour, keep terms stable

### Operations — `.claude/blocks/operations/`

`orient-in-codebase` · `clarify-task` · `decompose-into-workstreams` · `implement-change` ·
`verify-change` · `review-change` · `wrap-up-work`

The pipeline sequences these and states which are skipped in which lane. Open the operation when
you reach its step — each defines its own inputs, output shape, and escalation triggers.

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