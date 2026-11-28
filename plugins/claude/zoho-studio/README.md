# zoho-studio plugin

A Claude Code plugin for AI agents working in zoho-studio projects. Its skills cover the process of working with the person and knowledge about Zoho that the CLI's code does not carry; what the CLI itself does comes from `zoho-studio instructions` of the installed version.

- `skills/` — the skills, one folder per skill, called as `/zoho-studio:<skill>`.

How skills are written: `.claude/rules/skills.md` in the repository. How to install the plugin: `docs/en/guides/claude-code-plugin.md`.

## Install

From a clone of the zoho-studio repository:

```bash
claude plugin marketplace add <path to the clone>
claude plugin install zoho-studio@zoho-studio
```
