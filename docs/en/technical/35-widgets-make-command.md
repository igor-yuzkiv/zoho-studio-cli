# `zoho-studio z-crm:widgets:make`

Creates `widgets/<name>/` for a widget that already runs somewhere: its description, a scenario that
opens one record, a fixture with that record, and a Playwright test — a folder that runs as is with
[`z-crm:widgets:serve`](34-widgets-serve-command.md). It asks nothing, so an agent can call it.

```bash
zoho-studio z-crm:widgets:make --name=deal-card --url=http://127.0.0.1:5000/app/widget.html
zoho-studio z-crm:widgets:make -n deal-card -u http://127.0.0.1:5000/ -l "Custom Button" -m Deals -s ../deal-card-widget/app
```

```text
Created widgets/deal-card/widget.json
Created widgets/deal-card/scenarios/default.ts
Created widgets/deal-card/fixtures/Deals.json
Created widgets/deal-card/tests/deal-card.spec.ts
Created playwright.config.ts
```

## Options

- `-n, --name <name>` — required, the folder name. A name that already has a `widget.json` is refused.
- `-u, --url <url>` — required, the http(s) address the widget runs at.
- `-l, --location <type>` — where Zoho CRM shows it: `Dashboard`, `Web Tab`, `Custom Button`,
  `Custom Related List`, `Wizard`, `Signal`, `Settings`, `Blueprint`.
- `-m, --module <api_name>` — the module of the sample record, `Leads` by default.
- `-s, --source <path>` — where the widget's code is, relative to the project or absolute.

## What it writes

- `widget.json` — the address, the location, the source, and `defaultScenario: "default"`.
- `scenarios/default.ts` — `PageLoad` for record `1000000000001` of the module, and an empty `mocks`.
- `fixtures/<Module>.json` — that record.
- `tests/<name>.spec.ts` — opens the widget and saves a screenshot.
- `playwright.config.ts` at the project root — only when the project has none: tests under
  `widgets/**/tests/`, the HTML report in `widgets/.report/`, and `webServer` starting
  `zoho-studio z-crm:widgets:serve --port=4610`.

To run the test, add Playwright to the project once (`bun add -d @playwright/test`,
`bunx playwright install chromium`), start the widget, and run `bunx playwright test`.
