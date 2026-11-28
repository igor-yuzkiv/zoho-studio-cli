# Zoho CRM Studio CLI

English: [README.md](README.md)

Zoho Studio CLI — інструмент командного рядка для розробників, призначений для роботи з ресурсами, конфігурацією, метаданими й кодом платформи Zoho.

Проєкт має на меті наблизити розробку під Zoho до звичних інженерних процесів, представляючи віддалені ресурси в структурованому, локальному й зручному для автоматизації вигляді.

Він розрахований і на розробників, і на ШІ-агентів і дає передбачуваний інтерфейс для перегляду, керування й обробки артефактів проєкту Zoho через скрипти, інструменти розробки та процеси на основі агентів.

## Як отримати CLI

CLI збирається з цього репозиторію; готових релізів немає. Потрібен
[Bun](https://bun.sh) 1.3 або новіший.

```bash
git clone <this repository> zoho-studio-cli
cd zoho-studio-cli
bun install
bun run compile                              # → dist/zoho-studio, with the web app inside
ln -s "$PWD/dist/zoho-studio" ~/.local/bin/zoho-studio   # or any folder on your PATH
bun run link                                 # once, so projects can import the packages
```

Після цього `zoho-studio --help` покаже список команд, а `zoho-studio --version` — встановлену версію. Щоб оновитися, підтягніть репозиторій і
знову запустіть `bun run compile`; посилання з `bun run link` стежить за вихідним кодом і оновлення
не потребує. Вперше працюєте з інструментом? Почніть із [посібника користувача](docs/ua/guides/README.md).

## Документація

- [Огляд](docs/ua/reference/README.md) — що таке проєкт і як запускати CLI
- [Налаштування проєкту](docs/ua/reference/project/settings.md) — `.zoho-studio/settings.json` і те, як CLI його читає
- [init](docs/ua/reference/project/init.md) — створення проєкту командою `zoho-studio init`
- [login](docs/ua/reference/project/login.md) — авторизація проєкту командою `zoho-studio login`
- [z-crm:status](docs/ua/reference/crm-org/status.md) — перевірка підключення командою `zoho-studio z-crm:status`
- [z-crm:functions:pull](docs/ua/reference/crm-functions/pull.md) — завантаження функцій
- [z-crm:modules:pull](docs/ua/reference/crm-metadata/modules.md) — завантаження метаданих модулів
- [z-crm:fields:pull](docs/ua/reference/crm-metadata/fields.md) — завантаження полів модулів
- [z-crm:layouts:pull](docs/ua/reference/crm-metadata/layouts.md) — завантаження layouts модулів із секціями та формулами
- [z-crm:functions:make](docs/ua/reference/crm-functions/make.md) — створення нової Deluge-функції в `src/` або імпорт завантаженої
- [z-crm:functions:import](docs/ua/reference/crm-functions/import.md) — копіювання завантаженої функції з `data/` у `src/`
- [z-crm:functions:deploy](docs/ua/reference/crm-functions/deploy.md) — створення або оновлення функції в Zoho з `src/`
- [z-crm:functions:run](docs/ua/reference/crm-functions/run.md) — запуск коду функції з `src/` або `data/` у Zoho з виведенням результату
- [z-crm:migrations:make](docs/ua/reference/crm-migrations/make.md) — створення файлу міграції за кількома запитаннями
- [z-crm:widgets:make](docs/ua/reference/crm-widgets/make.md) — створення папки віджета зі сценарієм і тестом Playwright
- [z-crm:widgets:serve](docs/ua/reference/crm-widgets/serve.md) — запуск віджетів в емульованій Zoho CRM з мок-відповідями SDK
- [z-crm:workflows:pull](docs/ua/reference/crm-metadata/workflows.md) — завантаження правил робочих процесів
- [z-crm:org:info](docs/ua/reference/crm-org/org-info.md) — читання організації та її збереження в проєкті
- [z-crm:workflow-actions:pull](docs/ua/reference/crm-metadata/workflow-actions.md) — завантаження дій робочих процесів
- [z-crm:webhooks:pull](docs/ua/reference/crm-metadata/webhooks.md) — завантаження вебхуків
- [z-crm:global-picklists:pull](docs/ua/reference/crm-metadata/global-picklists.md) — завантаження глобальних списків вибору
- [z-crm:profiles:pull](docs/ua/reference/crm-metadata/profiles.md) — завантаження профілів
- [z-crm:client-scripts:pull](docs/ua/reference/crm-metadata/client-scripts.md) — завантаження клієнтських скриптів
- [z-crm:static-resources:pull](docs/ua/reference/crm-metadata/static-resources.md) — завантаження статичних ресурсів
- [preset](docs/ua/reference/project/preset.md) — запуск іменованої послідовності команд
- [browser](docs/ua/reference/project/browser.md) — перегляд артефактів і запуск завантажень у локальному вебзастосунку

## Скрипти в проєкті

Проєкт, створений `zoho-studio init`, має `package.json`, що підключає пакети фреймворку
(`@zoho-studio/core`, `@zoho-studio/auth`, `@zoho-studio/zoho-crm`),
і `scripts/example.ts` для копіювання. Один раз запустіть `bun run link` у цьому репозиторії, потім
`bun install` у проєкті; див. [init](docs/ua/reference/project/init.md#скрипти).

`bun run migrate` у проєкті створює модулі Zoho CRM і додає поля з файлів у
`migrations/zoho-crm/`; див. [міграції](docs/ua/reference/crm-migrations/migrations.md). `zoho-studio z-crm:migrations:make`
створює заготовку нової міграції.

## Підтримка в редакторі

Завантажені функції зберігаються як файли `.deluge`. Для підсвічування синтаксису, IntelliSense та
підказок до вбудованих функцій Zoho встановіть
[Deluge Language Support](https://marketplace.visualstudio.com/items?itemName=BagaduceDigital.deluge-lang)
від OldPine Digital — воно реєструє і `.deluge`, і `.ds`, тож підхоплює файли як є.

## Команди

```bash
bun install             # dependencies
bun run dev -- --help   # run CLI from source
bun run lint            # eslint
bun run typecheck       # tsc --noEmit
bun test                # tests
bun run check           # lint + typecheck + tests
bun run build           # bun-targeted bundle → dist/
bun run compile         # web app + standalone executable with the page embedded → dist/
bun run link            # register packages/* in Bun's link registry, for projects made by `init`
bun run unlink          # remove that registration
bun run dev:web         # web app dev server (Vite)
bun run build:web       # web app build → dist/web
```
