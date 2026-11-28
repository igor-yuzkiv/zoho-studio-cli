# Claude Code plugin

The repository is also a Claude Code marketplace named `zoho-studio` with one plugin, `zoho-studio`, which carries the skills for AI agents working in zoho-studio projects. It is installed from the same clone as the CLI and has the same version.

Українська версія: [ua](../../ua/guides/claude-code-plugin.md)

## Install

You need [Claude Code](https://code.claude.com) and a clone of this repository — the one [Installation](installation.md) builds the CLI from.

```bash
claude plugin marketplace add <path to the clone>   # once per machine
claude plugin install zoho-studio@zoho-studio
```

The plugin is installed for all your projects by default; `--scope project` or `--scope local` limits it to the current project. In a running session, `/reload-plugins` picks it up; a new session does as well. Check the result with `claude plugin list` or `/plugin`.

## Set up the machine

In a Claude Code session, run `/zoho-studio:setup`. It checks everything on the plugin's dependency list (`plugins/claude/zoho-studio/references/dependencies.md`) — the clone and its version, and what the CLI and the plugin rely on — shows what it would install or update, and does only what you agree to. Run it again after every update; when everything is current, it says so and changes nothing.

## Update

```bash
git pull           # in the clone
bun run setup      # updates the CLI of the same version
```

Or let `/zoho-studio:setup` do both. Then `/reload-plugins` or a new session, and `/zoho-studio:setup` once more. Claude Code reads the plugin straight from the clone, so the branch or tag the clone is on decides which version you get; keep it on `master` for released versions.

## Remove

```bash
claude plugin uninstall zoho-studio@zoho-studio
claude plugin marketplace remove zoho-studio
```
