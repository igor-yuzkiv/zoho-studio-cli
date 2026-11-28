# Проєкт

Проєкт — це папка, у якій є `.zoho-studio/settings.json`. Її створює `zoho-studio init`; кожна
команда працює з папки проєкту або з будь-якої папки всередині неї.

```text
my-crm/
  .zoho-studio/
    settings.json          which Zoho region to use, what to ask permission for, presets
    org.json               the organization the project is logged in to
    migrations.json        which migrations ran, per organization
  data/zoho-crm/           snapshots: everything downloaded from the CRM
  src/zoho-crm/functions/  functions you develop locally
  migrations/zoho-crm/     migration files you write
  logs/                    the log of every command
  scripts/                 scripts you write, including the migrate script
  widgets/                 widgets you develop and test locally
  .claude/skills/          a Claude Code skill for testing widgets
  package.json             the packages scripts and migrations use
  tsconfig.json            перевіряє типи скриптів і міграцій за пакетами
```

Те, що pull завантажує в `data/zoho-crm/`, — це snapshot: копія стану CRM, яку наступний pull замінює;
сторінка [глосарію](../glossary.md) визначає його та інші терміни.

## Налаштування

`.zoho-studio/settings.json` не містить секретів. Кожен ключ у ньому необов'язковий: для того,
що ви не вказали, діє типове значення. Ті, які ви найімовірніше змінюватимете:

- `auth.baseUrl`, `api.baseUrl` — ваш дата-центр Zoho, див.
  [Підключення до Zoho](zoho-connection.md#дата-центри);
- `presets` — ваші власні послідовності команд, див. [Завантаження](pulling.md#пресети).

Повний опис — у [довіднику з налаштувань](../reference/project/settings.md).

## Що потрапляє в git

`init` робить проєкт git-репозиторієм, без першого коміту, і готує те, що в нього потрапляє:

- **не потрапляють:** `settings.json`, `org.json`, `migrations.json`, логи, `node_modules`, результати тестів віджетів, `data/.removed/`;
- **призначені для коміту:** `data/`, `src/`, `migrations/`, `scripts/`, `widgets/`, `.claude/`, `package.json`, `tsconfig.json`.

Облікових даних у проєкті немає взагалі — вони в `~/.zoho-studio`.

## Скрипти й міграції

У `scripts/` і `migrations/` лежать файли TypeScript, які використовують пакети з Zoho Studio.
Щоб їх запускати, пакети треба один раз зв'язати на вашому комп'ютері (`bun run link` у
репозиторії Zoho Studio, див. [README](../../../README.md#getting-the-cli)) і встановити в проєкті:

```bash
bun install
```

Міграції описано на сторінці [Міграції](migrations.md), скрипти — на сторінці [Скрипти й пакети](scripts-and-packages.md). Більше про файли проєкту:
[довідник з init](../reference/project/init.md).
