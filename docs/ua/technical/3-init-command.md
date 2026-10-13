# `zoho-studio init`

Створює проєкт Zoho Studio: будує дерево проєкту з шаблону, вбудованого в CLI, і записує
`.zoho-studio/settings.json`, заповнений типовими значеннями.

```bash
zoho-studio init                 # current folder
zoho-studio init my-project      # creates the folder if it is missing
zoho-studio init --force         # reset settings.json to the defaults
```

Вивід показує, що змінилося:

```text
Initialized Zoho Studio project in my-project
  .zoho-studio/settings.json — created
  src/.gitkeep — created
  logs/.gitignore — created
  .zoho-studio/.gitignore — created
  .gitignore — created
  package.json — created
  tsconfig.json — created
  scripts/example.ts — created
  scripts/migrate.ts — created
  scripts/example-migration.ts.txt — created
  migrations/zoho-crm/.gitkeep — created

Next steps:
  Run "zoho-studio login" and choose or create a credential profile
  Run "bun run link" once in the framework repository, then "bun install" here, to use the packages from scripts/
```

Файл шаблону позначається як `created` або `skipped`; `skipped` означає, що файл уже був і його
не чіпали.

## Що ви отримуєте

```text
my-project/
  .gitignore             # keeps node_modules out of git
  .zoho-studio/
    .gitignore           # keeps settings.json, org.json and migrations.json out of git
    settings.json        # project settings, chmod 0600
  logs/
    .gitignore           # keeps *.log out of git
  migrations/
    zoho-crm/            # migration files, see 27-migrations.md
  package.json           # the framework packages as link: dependencies, and the migrate script
  scripts/
    example.ts           # a script to copy: counts the fields of every pulled module
    migrate.ts           # runs a migration: bun run migrate
    example-migration.ts.txt  # a migration to copy into migrations/zoho-crm/
  src/
  tsconfig.json          # type-checks scripts/ against the packages' sources
```

`src/` — це місце, куди пише кожне завантаження: `src/zoho-crm/functions`, `src/zoho-crm/modules`, `src/zoho-crm/workflows`. Ці шляхи
фіксовані, і жодне налаштування їх не змінює. Кожна папка з'являється під час першого
завантаження, яке її наповнює.

Усе, крім `settings.json`, береться з шаблону, і **наявний файл ніколи не перезаписується** — ні з
`--force`, ні без нього. Редагуйте отримані файли; пізніший `init` лише додає те, чого бракує.
Видаліть файл і знову запустіть `init`, щоб повернути його.

Кореневий `.gitignore` створюється, лише коли в проєкті його немає; наявний лишається рівно таким,
як є. Два `.gitignore` усередині папок ідуть разом із тим, що вони захищають, тож файл
налаштувань, знімок організації та логи лишаються поза git, хоч би де лежав проєкт.

## Скрипти

`package.json` перелічує чотири пакети фреймворку — `@zoho-studio/core`, `@zoho-studio/auth`,
`@zoho-studio/zoho-crm` — як залежності `link:`, що розв'язуються за назвою
з реєстру посилань Bun, а не за шляхом. Зареєструйте їх один раз на машині, з клону
репозиторію фреймворку:

```bash
bun run link        # in the framework repository; `bun run unlink` reverses it
```

Потім у проєкті:

```bash
bun install
bun run scripts/example.ts
```

Посилання живе: проєкт бачить вихідний код пакетів таким, яким він є в репозиторії, без збирання
чи перевстановлення після змін там. `bunx tsc --noEmit` у проєкті перевіряє типи `scripts/`
і `migrations/` щодо цього коду. Після переміщення репозиторію знову запустіть `bun run link`.

`scripts/example.ts` читає лише локальні артефакти, тож працює ще до будь-якого входу; коли
`src/zoho-crm/modules` ще порожня, він підказує, які завантаження запустити. Скопіюйте його, щоб
почати власний скрипт.

Далі запустіть [`zoho-studio login`](4-login-command.md): він дає змогу вибрати збережений профіль
облікових даних або створити його з вашого клієнта в консолі Zoho API. Решту файлу налаштувань див.
у [2-settings.md](2-settings.md).

## Коли вона відмовляє

`init` зупиняється, якщо `.zoho-studio/settings.json` уже існує, щоб випадковий повторний запуск
не стер ваші налаштування. Вона також зупиняється, якщо цільовий шлях — файл, а не папка, або якщо
сама `.zoho-studio` — файл.

`--force` скасовує лише перший випадок, і це **скидання `settings.json`, а не виправлення й не
повторне створення проєкту**: лише цей файл повертається до типових значень, і кожне значення, яке
ви в ньому встановили, зникає; профілі й токени в `~/.zoho-studio` не зачіпаються. Скасувати це
неможливо. Щоб змінити одне значення, відредагуйте файл.

`init` ніколи нічого не видаляє в `src/`, ні з `--force`, ні без нього.
