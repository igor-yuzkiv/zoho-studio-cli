# `zoho-studio z-crm:widgets:make`

Creates `widgets/<name>/` for a widget: its description, a scenario that opens one record, a mocks file that answers reading it, and a Playwright test — a folder that runs as is with [`z-crm:widgets:serve`](serve.md). It asks nothing, so an agent can call it.

```bash
zoho-studio z-crm:widgets:make --name=deal-card --url=http://127.0.0.1:5000/app/widget.html
zoho-studio z-crm:widgets:make -n deal-card -u http://127.0.0.1:5000/ -l "Custom Button" -m Deals -r "npm run dev"
```

```text
Created widgets/deal-card/widget.json
Created widgets/deal-card/testing/scenarios/default.ts
Created widgets/deal-card/testing/mocks/record.ts
Created widgets/deal-card/testing/tests/deal-card.spec.ts
Created playwright.config.ts
```

## Options

- `-n, --name <name>` — required, the folder name. A name that already has a `widget.json` is refused.
- `-u, --url <url>` — required, the http(s) address the widget runs at.
- `-l, --location <type>` — where Zoho CRM shows it: `Dashboard`, `Web Tab`, `Custom Button`,
  `Custom Related List`, `Wizard`, `Signal`, `Settings`, `Blueprint`.
- `-m, --module <api_name>` — the module of the sample record, `Leads` by default.
- `-s, --source <path>` — where the widget's code is, relative to the widget folder or absolute. Leave it out when the code is in `widgets/<name>/src/`: that folder is the default.
- `-r, --run <command>` — the shell command that starts the widget, stored as `run.command`; with it the emulator starts the widget itself (see [`serve`](serve.md#starting-the-widget)).

## What it writes

- `widget.json` — the address, the location, the source and the run command when given, and `defaultScenario: "default"`.
- `testing/scenarios/default.ts` — `PageLoad` for record `1000000000001` of the module, using the mocks of `record`.
- `testing/mocks/record.ts` — a mock of `API.getRecord` that answers with that record.
- `testing/tests/<name>.spec.ts` — opens the widget and saves a screenshot.
- `playwright.config.ts` at the project root — only when the project has none: tests under `widgets/**/testing/tests/`, the HTML report in `widgets/.report/`, and `webServer` starting `zoho-studio z-crm:widgets:serve --port=4610` and stopping it with `SIGTERM`, so the widgets it started stop too.

It does not create `src/`: put the widget's code there, or point `--source` at it.

To run the test, add Playwright to the project once (`bun add -d @playwright/test`, `bunx playwright install chromium`) and run `bunx playwright test`. Without `--run`, start the widget first.
