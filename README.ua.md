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

Після цього `zoho-studio --help` покаже список команд. Щоб оновитися, підтягніть репозиторій і
знову запустіть `bun run compile`; посилання з `bun run link` стежить за вихідним кодом і оновлення
не потребує. Вперше працюєте з інструментом? Почніть із [посібника користувача](docs/ua/user-guide/1-overview.md).

## Документація

- [Огляд](docs/ua/technical/1-overview.md) — що таке проєкт і як запускати CLI
- [Налаштування проєкту](docs/ua/technical/2-settings.md) — `.zoho-studio/settings.json` і те, як CLI його читає
- [init](docs/ua/technical/3-init-command.md) — створення проєкту командою `zoho-studio init`
- [login](docs/ua/technical/4-login-command.md) — авторизація проєкту командою `zoho-studio login`
- [z-crm:status](docs/ua/technical/5-status-command.md) — перевірка підключення командою `zoho-studio z-crm:status`
- [z-crm:functions:pull](docs/ua/technical/6-functions-pull-command.md) — завантаження функцій
- [z-crm:modules:pull](docs/ua/technical/7-modules-pull-command.md) — завантаження метаданих модулів
- [z-crm:fields:pull](docs/ua/technical/8-fields-pull-command.md) — завантаження полів модулів
- [z-crm:layouts:pull](docs/ua/technical/28-layouts-pull-command.md) — завантаження layouts модулів із секціями та формулами
- [z-crm:functions:make](docs/ua/technical/29-functions-make-command.md) — створення нової Deluge-функції в `src/` або імпорт завантаженої
- [z-crm:workflows:pull](docs/ua/technical/9-workflows-pull-command.md) — завантаження правил робочих процесів
- [z-crm:org:info](docs/ua/technical/10-org-info-command.md) — читання організації та її збереження в проєкті
- [z-crm:workflow-actions:pull](docs/ua/technical/11-workflow-actions-pull-command.md) — завантаження дій робочих процесів
- [z-crm:webhooks:pull](docs/ua/technical/12-webhooks-pull-command.md) — завантаження вебхуків
- [z-crm:global-picklists:pull](docs/ua/technical/13-global-picklists-pull-command.md) — завантаження глобальних списків вибору
- [z-crm:profiles:pull](docs/ua/technical/26-profiles-pull-command.md) — завантаження профілів
- [z-crm:client-scripts:pull](docs/ua/technical/22-client-scripts-pull-command.md) — завантаження клієнтських скриптів
- [z-crm:static-resources:pull](docs/ua/technical/23-static-resources-pull-command.md) — завантаження статичних ресурсів
- [preset](docs/ua/technical/24-preset-command.md) — запуск іменованої послідовності команд
- [browser](docs/ua/technical/25-browser-command.md) — перегляд артефактів і запуск завантажень у локальному вебзастосунку

## Скрипти в проєкті

Проєкт, створений `zoho-studio init`, має `package.json`, що підключає пакети фреймворку
(`@zoho-studio/core`, `@zoho-studio/auth`, `@zoho-studio/zoho-crm`),
і `scripts/example.ts` для копіювання. Один раз запустіть `bun run link` у цьому репозиторії, потім
`bun install` у проєкті; див. [init](docs/ua/technical/3-init-command.md#скрипти).

`bun run migrate` у проєкті створює модулі Zoho CRM і додає поля з файлів у
`migrations/zoho-crm/`; див. [міграції](docs/ua/technical/27-migrations.md).

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
