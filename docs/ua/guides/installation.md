# Встановлення

CLI збирається з його репозиторію на вашій машині; готових бінарників немає. Потрібні [Bun](https://bun.sh) 1.3 або новіший і git.

English version: [en](../../en/guides/installation.md)

## Встановити

```bash
git clone <this repository> zoho-studio-cli
cd zoho-studio-cli
bun install
bun run compile                              # → dist/zoho-studio, with the web app inside
ln -s "$PWD/dist/zoho-studio" ~/.local/bin/zoho-studio   # or any folder on your PATH
bun run link                                 # once, so projects can import the packages
```

`bun run link` реєструє пакети фреймворку на цій машині, щоб скрипти й міграції проєкту, створеного [`zoho-studio init`](../reference/project/init.md), могли імпортувати їх за назвою.

## Перевірити результат

```bash
zoho-studio --version
zoho-studio --help
```

`--version` друкує встановлену версію, `--help` показує список команд. Якщо оболонка не знаходить `zoho-studio`, папки з посиланням немає у вашому `PATH`.

## Оновити

Підтягніть репозиторій і зберіть знову:

```bash
git pull
bun install
bun run compile
```

Посилання в `~/.local/bin` вказує на `dist/zoho-studio`, тож підхоплює нову збірку. Реєстрація з `bun run link` стежить за вихідним кодом і оновлення не потребує.

## Далі

[Швидкий старт](quick-start.md) — від нуля до завантажених файлів за кілька хвилин.
