# Довідник

English version: [en](../../en/reference/README.md)

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
задачею, прочитайте [посібник користувача](../guides/README.md).

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
`zoho-studio --version` (або `-V`) друкує версію CLI.

## Документи

- [Глосарій](../glossary.md) — терміни, якими користується документація: artifact, pull, snapshot, source, scaffold, import, deploy

### Проєкт

- [Налаштування](project/settings.md) — файл налаштувань і те, як CLI його читає й записує
- [`zoho-studio init`](project/init.md) — створення проєкту командою `zoho-studio init`
- [`zoho-studio login`](project/login.md) — авторизація проєкту командою `zoho-studio login`
- [`zoho-studio preset`](project/preset.md) — запуск іменованої послідовності команд командою `zoho-studio preset`
- [`zoho-studio browser`](project/browser.md) — перегляд артефактів і запуск завантажень у локальному вебзастосунку командою `zoho-studio browser`

### Організація CRM

- [`zoho-studio z-crm:status`](crm-org/status.md) — перевірка підключення командою `zoho-studio z-crm:status`
- [`zoho-studio z-crm:org:info`](crm-org/org-info.md) — читання та збереження організації командою `zoho-studio z-crm:org:info`

### Метадані CRM

- [`zoho-studio z-crm:modules:pull`](crm-metadata/modules.md) — завантаження метаданих модулів командою `zoho-studio z-crm:modules:pull`
- [`zoho-studio z-crm:fields:pull`](crm-metadata/fields.md) — завантаження полів модулів командою `zoho-studio z-crm:fields:pull`
- [`zoho-studio z-crm:layouts:pull`](crm-metadata/layouts.md) — завантаження layouts модулів із секціями та формулами командою `zoho-studio z-crm:layouts:pull`
- [`zoho-studio z-crm:workflows:pull`](crm-metadata/workflows.md) — завантаження правил робочих процесів командою `zoho-studio z-crm:workflows:pull`
- [`zoho-studio z-crm:workflow-actions:pull`](crm-metadata/workflow-actions.md) — завантаження дій робочих процесів командою `zoho-studio z-crm:workflow-actions:pull`
- [`zoho-studio z-crm:webhooks:pull`](crm-metadata/webhooks.md) — завантаження вебхуків командою `zoho-studio z-crm:webhooks:pull`
- [`zoho-studio z-crm:global-picklists:pull`](crm-metadata/global-picklists.md) — завантаження глобальних списків вибору командою `zoho-studio z-crm:global-picklists:pull`
- [`zoho-studio z-crm:profiles:pull`](crm-metadata/profiles.md) — завантаження профілів командою `zoho-studio z-crm:profiles:pull`
- [`zoho-studio z-crm:client-scripts:pull`](crm-metadata/client-scripts.md) — завантаження клієнтських скриптів командою `zoho-studio z-crm:client-scripts:pull`
- [`zoho-studio z-crm:static-resources:pull`](crm-metadata/static-resources.md) — завантаження статичних ресурсів командою `zoho-studio z-crm:static-resources:pull`

### Функції CRM

- [`zoho-studio z-crm:functions:pull`](crm-functions/pull.md) — завантаження функцій командою `zoho-studio z-crm:functions:pull`
- [`zoho-studio z-crm:functions:make`](crm-functions/make.md) — створення нової Deluge-функції в `src/` або імпорт завантаженої командою `zoho-studio z-crm:functions:make`
- [`zoho-studio z-crm:functions:import`](crm-functions/import.md) — копіювання завантаженої функції з `data/` у `src/` командою `zoho-studio z-crm:functions:import`
- [`zoho-studio z-crm:functions:deploy`](crm-functions/deploy.md) — створення або оновлення функції в Zoho з `src/` командою `zoho-studio z-crm:functions:deploy`
- [`zoho-studio z-crm:functions:run`](crm-functions/run.md) — запуск коду функції з `src/` або `data/` у Zoho командою `zoho-studio z-crm:functions:run`

### Міграції CRM

- [Міграції](crm-migrations/migrations.md) — створення модулів і додавання полів із файлів міграцій командою `bun run migrate`
- [`zoho-studio z-crm:migrations:make`](crm-migrations/make.md) — створення файлу міграції за кількома запитаннями командою `zoho-studio z-crm:migrations:make`

### Віджети CRM

- [`zoho-studio z-crm:widgets:make`](crm-widgets/make.md) — створення папки віджета, яка одразу працює, командою `zoho-studio z-crm:widgets:make`
- [`zoho-studio z-crm:widgets:serve`](crm-widgets/serve.md) — запуск віджетів в емульованій Zoho CRM, сценарії й e2e-тести командою `zoho-studio z-crm:widgets:serve`
