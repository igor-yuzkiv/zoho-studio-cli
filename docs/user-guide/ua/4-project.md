# Проєкт

Проєкт — це папка, у якій є `.zoho-studio/settings.json`. Її створює `zoho-studio init`; кожна
команда працює з папки проєкту або з будь-якої папки всередині неї.

```text
my-crm/
  .zoho-studio/
    settings.json          which Zoho region to use, what to ask permission for, presets
    org.json               the organization the project is logged in to
    migrations.json        which migrations ran, per organization
  src/zoho-crm/            everything downloaded from the CRM
  migrations/zoho-crm/     migration files you write
  logs/                    the log of every command
  scripts/                 scripts you write, including the migrate script
  package.json             the packages scripts and migrations use
  tsconfig.json            перевіряє типи скриптів і міграцій за пакетами
```

## Налаштування

`.zoho-studio/settings.json` не містить секретів. Кожен ключ у ньому необов'язковий: для того,
що ви не вказали, діє типове значення. Ті, які ви найімовірніше змінюватимете:

- `auth.baseUrl`, `api.baseUrl` — ваш дата-центр Zoho, див.
  [Підключення до Zoho](3-zoho-connection.md#дата-центри);
- `presets` — ваші власні послідовності команд, див. [Завантаження](5-pulling.md#пресети).

Повний опис — у [довіднику з налаштувань](../../2-settings.md).

## Що потрапляє в git

`init` готує проєкт до git:

- **не потрапляють:** `settings.json`, `org.json`, `migrations.json`, журнали, `node_modules`;
- **призначені для коміту:** `src/`, `migrations/`, `scripts/`, `package.json`, `tsconfig.json`.

Облікових даних у проєкті немає взагалі — вони в `~/.zoho-studio`.

## Скрипти й міграції

У `scripts/` і `migrations/` лежать файли TypeScript, які використовують пакети з Zoho Studio.
Щоб їх запускати, пакети треба один раз зв'язати на вашому комп'ютері (`bun run link` у
репозиторії Zoho Studio, див. [README](../../../README.md#getting-the-cli)) і встановити в проєкті:

```bash
bun install
```

Міграції описано на сторінці [Міграції](7-migrations.md). Більше про файли проєкту:
[довідник з init](../../3-init-command.md).
