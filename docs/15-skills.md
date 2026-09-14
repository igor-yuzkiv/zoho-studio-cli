# Skills

The repository ships agent-facing skills alongside the CLI. A skill is a set of instructions
for Claude Code, not code the CLI runs — it is about working with what the CLI produced, so
it runs in a **pulled project**, not here.

`bun run deploy-skills` installs them: every folder under `skills/` is copied to
`~/.claude/skills/`, replacing whatever was there. Until that runs, editing a skill changes
nothing in a running session.

```bash
bun run deploy-skills
```

## zoho-crm-discovery

Works out how a Zoho CRM org behaves, from the configuration the CLI pulled — what triggers a
piece of automation, what a workflow rule, function, module, field, workflow action, webhook,
or picklist is connected to, and what breaks if it changes. The subject is the org's logic and
its connections; the files are where that logic is recorded.

It works at two depths. **Focused** answers one question and stops there. **Full**
investigates an artifact, a set of them, or a process spanning several, and produces a result
worth writing down.

Results can be visual. Inside a markdown document it draws mermaid without asking. For a
standing deliverable it builds a self-contained HTML page — a report or a connections map —
whose shape follows the investigation, with the diagrams as inline SVG so the file opens
offline with no external request.

The skill is read-only. `src/zoho-crm/` is a mirror the next pull overwrites, so the skill explains
what it reads and never edits it, and it does not run the CLI to refresh it.

Where a written-up investigation is stored is the pulled project's decision, not the skill's:
it reads that project's profile and conventions, and asks when neither answers.
