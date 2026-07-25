# Code style

## File naming

- Kebab-case, with a role suffix: `<name>.<role>.ts` — e.g. `init.command.ts`,
  `zoho-api.client.ts`, `function.service.ts`, `config-loader.ts`.
- Types/interfaces for a module go in `types.ts` within that module.
- Each module folder exposes its public surface via an `index.ts` barrel.
- Test files sit next to the code they test: `<name>.test.ts`.

## TypeScript

- `strict` mode is on — keep it. No `any` unless interfacing with an untyped boundary; prefer
  `unknown` + narrowing.
- Prefer `interface` for object shapes, `type` for unions and compositions.
- Use `verbatimModuleSyntax`-compatible imports: `import type { ... }` for type-only imports.
- Named exports only; no default exports.

## Self-documenting code

- Intention-revealing names over short or generic ones (`refreshAccessToken`, not `refresh`).
- Extract a variable or function when it clarifies non-trivial intent.
- Comments explain *why*, constraints, or external (Zoho) behavior — never *what* the code does.
- Do not leave TODO placeholders, commented-out code, or stub branches in delivered work.
