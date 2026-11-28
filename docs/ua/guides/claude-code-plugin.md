# Плагін Claude Code

Репозиторій — це ще й маркетплейс Claude Code під назвою `zoho-studio` з одним плагіном, `zoho-studio`, у якому лежать скіли для ШІ-агентів, що працюють у проєктах zoho-studio. Плагін ставиться з того самого клону, що й CLI, і має ту саму версію.

English version: [en](../../en/guides/claude-code-plugin.md)

## Встановити

Потрібні [Claude Code](https://code.claude.com) і клон цього репозиторію — той, з якого [Встановлення](installation.md) збирає CLI.

```bash
claude plugin marketplace add <path to the clone>   # once per machine
claude plugin install zoho-studio@zoho-studio
```

За замовчуванням плагін ставиться для всіх ваших проєктів; `--scope project` або `--scope local` обмежує його поточним проєктом. У запущеній сесії його підхоплює `/reload-plugins`, у новій сесії — автоматично. Перевірити результат можна командою `claude plugin list` або `/plugin`.

## Оновити

```bash
git pull           # in the clone
bun run setup      # updates the CLI of the same version
```

Потім `/reload-plugins` або нова сесія. Claude Code читає плагін просто з клону, тож версію визначає гілка чи тег, на якому стоїть клон; для випущених версій тримайте його на `master`.

## Видалити

```bash
claude plugin uninstall zoho-studio@zoho-studio
claude plugin marketplace remove zoho-studio
```
