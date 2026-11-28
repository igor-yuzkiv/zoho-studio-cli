# init

Scaffolds a zoho-studio project: the folder tree from the built-in template and
`.zoho-studio/settings.json` with the defaults. It also runs `git init` (no commit) when the folder
is not inside a repository yet.

- **Writes to Zoho:** no. **Needs login:** no. **Needs a terminal:** no.

## When to use

Once, to start a project — in the current folder or in `init <name>`. Running it again only adds
template files that are missing; an existing file is never overwritten.

## Side effects

- Refuses when `settings.json` already exists. `--force` resets that one file to the defaults —
  every value the person set is lost. Do not use `--force` without the person asking for it.
- Never deletes anything under `data/` or `src/`.
- Next steps it prints: `zoho-studio login` (the person does it, it needs a browser), then
  `bun run link` in the framework repository and `bun install` in the project for `scripts/`.
