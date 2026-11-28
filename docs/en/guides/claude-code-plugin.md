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

## Update

```bash
git pull           # in the clone
bun run setup      # updates the CLI of the same version
```

Then `/reload-plugins` or a new session. Claude Code reads the plugin straight from the clone, so the branch or tag the clone is on decides which version you get; keep it on `master` for released versions.

## Remove

```bash
claude plugin uninstall zoho-studio@zoho-studio
claude plugin marketplace remove zoho-studio
```
