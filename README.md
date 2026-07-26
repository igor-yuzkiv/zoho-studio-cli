# Zoho CRM Studio CLI

Zoho Studio CLI is a developer-focused command-line tool for working with Zoho platform resources, configuration, metadata, and code.

The project aims to bring Zoho development closer to conventional software engineering workflows by representing remote resources in a structured, local, and automation-friendly form.

It is designed for both developers and AI agents, providing a predictable interface for inspecting, managing, and processing Zoho project artifacts through scripts, development tools, and agent-driven workflows.

## Documentation

- [Overview](docs/1-overview.md) — what a project is, and how to run the CLI
- [Project settings](docs/2-settings.md) — `.zoho-studio/settings.json` and `zoho-studio init`

## Editor support

Pulled functions are saved as `.deluge` files. For syntax highlighting, IntelliSense, and hover
docs on Zoho's built-in functions, install
[Deluge Language Support](https://marketplace.visualstudio.com/items?itemName=BagaduceDigital.deluge-lang)
by OldPine Digital — it registers both `.deluge` and `.ds`, so it picks the files up as they are.

If you point `crm.functions.code_extension` at something else, either use `.ds`, or map your
extension to the `deluge` language in VS Code:

```json
{
    "files.associations": {
        "*.dg": "deluge"
    }
}
```

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
