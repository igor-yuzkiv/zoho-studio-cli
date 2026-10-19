# Огляд

English version: [en](../../en/technical/1-overview.md)

Zoho Studio CLI — це інструмент командного рядка для роботи з ресурсами платформи Zoho як із
локальними файлами, щоб розробка під Zoho вписувалася у звичні інженерні процеси — контроль
версій, скрипти й автоматизацію за допомогою агентів.

**Проєкт** — це будь-яка папка, що містить `.zoho-studio/settings.json`. Цей єдиний файл містить
усе, що CLI має знати про проєкт: з яким дата-центром працювати, який API викликати і які дозволи
(scopes) запитувати. Облікові дані зберігаються поза проєктом, у `~/.zoho-studio`, де кілька
проєктів можуть користуватися одним клієнтом. `zoho-studio init` створює проєкт навколо цього файлу.

Усе, що завантажує CLI, потрапляє в `data/`, у папку для кожного продукту Zoho, за шляхами, які
CLI фіксує і які не змінює жодне налаштування — `data/zoho-crm/functions`, `data/zoho-crm/modules`
(поля й layouts кожного модуля — у його власних папках `fields/` і `layouts/`), `data/zoho-crm/workflows`,
`data/zoho-crm/workflow-actions`, `data/zoho-crm/webhooks`, `data/zoho-crm/global-picklists`,
`data/zoho-crm/profiles`, `data/zoho-crm/client-scripts`, `data/zoho-crm/static-resources`.

У цій папці — технічний довідник, по сторінці на команду. Щоб опанувати інструмент задача за
задачею, прочитайте [посібник користувача](../user-guide/1-overview.md).

## Запуск CLI

CLI запускається з вихідного коду:

```bash
bun install
bun run dev -- --help
bun run dev -- init my-project
```

`bun run build` створює бандл у `dist/`, а `bun run compile` — самостійний виконуваний файл із
вбудованою вебсторінкою `zoho-studio browser`, `dist/zoho-studio`. Додайте його до `PATH`, щоб
викликати як `zoho-studio` — саме ця назва вживається в усіх цих документах; див. README.

## Документи

- [glossary.md](../glossary.md) — терміни, якими користується документація: artifact, pull, snapshot, source, scaffold, import, deploy
- [2-settings.md](2-settings.md) — файл налаштувань і те, як CLI його читає й записує
- [3-init-command.md](3-init-command.md) — створення проєкту командою `zoho-studio init`
- [4-login-command.md](4-login-command.md) — авторизація проєкту командою `zoho-studio login`
- [5-status-command.md](5-status-command.md) — перевірка підключення командою `zoho-studio z-crm:status`
- [6-functions-pull-command.md](6-functions-pull-command.md) — завантаження функцій командою `zoho-studio z-crm:functions:pull`
- [7-modules-pull-command.md](7-modules-pull-command.md) — завантаження метаданих модулів командою `zoho-studio z-crm:modules:pull`
- [8-fields-pull-command.md](8-fields-pull-command.md) — завантаження полів модулів командою `zoho-studio z-crm:fields:pull`
- [9-workflows-pull-command.md](9-workflows-pull-command.md) — завантаження правил робочих процесів командою `zoho-studio z-crm:workflows:pull`
- [10-org-info-command.md](10-org-info-command.md) — читання та збереження організації командою `zoho-studio z-crm:org:info`
- [11-workflow-actions-pull-command.md](11-workflow-actions-pull-command.md) — завантаження дій робочих процесів командою `zoho-studio z-crm:workflow-actions:pull`
- [12-webhooks-pull-command.md](12-webhooks-pull-command.md) — завантаження вебхуків командою `zoho-studio z-crm:webhooks:pull`
- [13-global-picklists-pull-command.md](13-global-picklists-pull-command.md) — завантаження глобальних списків вибору командою `zoho-studio z-crm:global-picklists:pull`
- [22-client-scripts-pull-command.md](22-client-scripts-pull-command.md) — завантаження клієнтських скриптів командою `zoho-studio z-crm:client-scripts:pull`
- [23-static-resources-pull-command.md](23-static-resources-pull-command.md) — завантаження статичних ресурсів командою `zoho-studio z-crm:static-resources:pull`
- [24-preset-command.md](24-preset-command.md) — запуск іменованої послідовності команд командою `zoho-studio preset`
- [25-browser-command.md](25-browser-command.md) — перегляд артефактів і запуск завантажень у локальному вебзастосунку командою `zoho-studio browser`
- [26-profiles-pull-command.md](26-profiles-pull-command.md) — завантаження профілів командою `zoho-studio z-crm:profiles:pull`
- [27-migrations.md](27-migrations.md) — створення модулів і додавання полів із файлів міграцій командою `bun run migrate`
- [28-layouts-pull-command.md](28-layouts-pull-command.md) — завантаження layouts модулів із секціями та формулами командою `zoho-studio z-crm:layouts:pull`
- [29-functions-make-command.md](29-functions-make-command.md) — створення нової Deluge-функції в `src/` або імпорт завантаженої командою `zoho-studio z-crm:functions:make`
- [30-functions-deploy-command.md](30-functions-deploy-command.md) — створення або оновлення функції в Zoho з `src/` командою `zoho-studio z-crm:functions:deploy`
- [31-functions-import-command.md](31-functions-import-command.md) — копіювання завантаженої функції з `data/` у `src/` командою `zoho-studio z-crm:functions:import`
- [32-migrations-make-command.md](32-migrations-make-command.md) — створення файлу міграції за кількома запитаннями командою `zoho-studio z-crm:migrations:make`
