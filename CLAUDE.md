# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

`zoho-studio-cli` — CLI for working with Zoho services. Stack: Bun + TypeScript, Commander (CLI),
Axios (Zoho API), bunfig (config loading from `.zoho-studio/`).

## Commands

```bash
bun install             # dependencies
bun run dev -- --help   # run CLI from source
bun run lint            # eslint
bunx tsc --noEmit       # type check
bun test                # tests
bun run build           # bun-targeted bundle → dist/
bun run compile         # standalone executable → dist/
```

## Rules

This file is a router. The actual rules live in `.claude/rules/` — read the relevant file before
working in its area:

- [principles.md](.claude/rules/principles.md) — KISS, DRY, smallest complete change, evidence
  over assumptions, contract preservation
- [code-style.md](.claude/rules/code-style.md) — NestJS-style file naming, self-documenting code,
  TypeScript conventions, Bun-not-Node
- [git.md](.claude/rules/git.md) — commit policy and message format
