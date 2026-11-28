# Плагін zoho-studio

Плагін Claude Code для ШІ-агентів, що працюють у проєктах zoho-studio. Його скіли покривають процес роботи з людиною і знання про Zoho, яких немає в коді CLI; що вміє сам CLI, агент бере з `zoho-studio instructions` встановленої версії.

- `skills/` — скіли, по одній папці на скіл, викликаються як `/zoho-studio:<skill>`.

Як пишуться скіли: `.claude/rules/skills.md` у репозиторії. Як встановити плагін: `docs/ua/guides/claude-code-plugin.md`.

## Встановлення

З клону репозиторію zoho-studio:

```bash
claude plugin marketplace add <path to the clone>
claude plugin install zoho-studio@zoho-studio
```
