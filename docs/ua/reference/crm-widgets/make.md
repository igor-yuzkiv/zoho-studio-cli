# `zoho-studio z-crm:widgets:make`

Створює `widgets/<name>/` для віджета, який уже десь працює: його опис, сценарій, що відкриває один
запис і мокає його читання, і тест Playwright — папку, яка одразу працює з
[`z-crm:widgets:serve`](serve.md). Команда нічого не питає, тож її може викликати агент.

```bash
zoho-studio z-crm:widgets:make --name=deal-card --url=http://127.0.0.1:5000/app/widget.html
zoho-studio z-crm:widgets:make -n deal-card -u http://127.0.0.1:5000/ -l "Custom Button" -m Deals -s ../deal-card-widget/app
```

```text
Created widgets/deal-card/widget.json
Created widgets/deal-card/scenarios/default.ts
Created widgets/deal-card/tests/deal-card.spec.ts
Created playwright.config.ts
```

## Опції

- `-n, --name <name>` — обов'язково, назва папки. Назву, для якої вже є `widget.json`, команда відхиляє.
- `-u, --url <url>` — обов'язково, http(s)-адреса, за якою працює віджет.
- `-l, --location <type>` — де Zoho CRM показує віджет: `Dashboard`, `Web Tab`, `Custom Button`,
  `Custom Related List`, `Wizard`, `Signal`, `Settings`, `Blueprint`.
- `-m, --module <api_name>` — модуль зразкового запису, за замовчуванням `Leads`.
- `-s, --source <path>` — де лежить код віджета, відносно проєкту або абсолютним шляхом.

## Що вона пише

- `widget.json` — адреса, локація, шлях до коду й `defaultScenario: "default"`.
- `scenarios/default.ts` — `PageLoad` для запису `1000000000001` модуля і мок `API.getRecord`,
  що відповідає цим записом.
- `tests/<name>.spec.ts` — відкриває віджет і зберігає скріншот.
- `playwright.config.ts` у корені проєкту — лише коли його ще немає: тести в `widgets/**/tests/`,
  HTML-звіт у `widgets/.report/` і `webServer`, що запускає `zoho-studio z-crm:widgets:serve --port=4610`.

Щоб запустити тест, один раз додайте Playwright у проєкт (`bun add -d @playwright/test`,
`bunx playwright install chromium`), запустіть віджет і виконайте `bunx playwright test`.
