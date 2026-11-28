---
paths:
  - "plugins/**"
  - "plugins-ua/**"
---

# Rule: Plugin dependencies

`plugins/claude/zoho-studio/references/dependencies.md` is the one list of what the plugin needs on the machine. `/zoho-studio:setup` checks and installs from it, so a dependency missing from the list is never checked and the skill that relies on it fails on another machine.

- **A skill relies on an external tool, service, or repository** — a CLI, an MCP server, a cloned repository, a runtime — and it is not in the list: add it to `dependencies.md` and to its mirror in `plugins-ua/` in the same change as the skill.
- **Each entry** says who needs it, how to check it, how to install or update it, and what happens without it when it is optional.
- **No skill uses the dependency any more**: remove it from both files in the same change.
- **Skills do not repeat the list.** A skill names the tool it uses; how to install it lives only in `dependencies.md`.
- **The agent installs nothing on its own.** Every install command in the list runs only after the person agreed to it.

Before a release, `/release` compares the tools the skills name with the list.
