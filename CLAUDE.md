# CLAUDE.md

- Guidance for Claude Code (claude.ai/code) when working in this repository.
- Local environment-specific instructions may be defined in CLAUDE.local.md.
- This project uses a project office — for its tasks and documentation, see .project-office/AGENTS.md.

## Project

Zoho Studio CLI is a developer-focused command-line tool for working with Zoho platform resources, configuration, metadata, and code.

The project aims to bring Zoho development closer to conventional software engineering workflows by representing remote resources in a structured, local, and automation-friendly form.

It is designed for both developers and AI agents, providing a predictable interface for inspecting, managing, and processing Zoho project artifacts through scripts, development tools, and agent-driven workflows.

## Project Rules

- [principles.md](.claude/rules/principles.md) — general principles for any work
- [architecture.md](.claude/rules/architecture.md) — project architecture and code style

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