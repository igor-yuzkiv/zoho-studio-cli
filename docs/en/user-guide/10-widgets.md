# Widgets

Zoho Studio runs your Zoho CRM widgets on your computer, without Zoho: you open a widget, it gets a
record and answers to its SDK calls, and you see what it does — by hand or in automated tests with
screenshots. You build the widget your usual way; nothing in its code changes.

**Your widget must be running** — with `zet run`, a dev server, or any static server. Zoho Studio
opens it at that address and plays Zoho CRM around it.

## Add a widget

```bash
zoho-studio z-crm:widgets:make --name=deal-card --url=http://127.0.0.1:5000/app/widget.html --module=Deals
```

This creates `widgets/deal-card/` with:

- `widget.json` — where the widget runs;
- `scenarios/default.ts` — which record the widget opens on and how Zoho answers it;
- `fixtures/Deals.json` — the records it can read;
- `tests/deal-card.spec.ts` — an automated test.

If the widget reads fields, layouts or modules, pull them first — `z-crm:fields:pull --module=Deals`
and so on. Zoho Studio answers those calls from the pulled files.

## Look at it

```bash
zoho-studio browser
```

Open **Widgets**, pick the widget and a scenario, press **Open**. The panel on the right shows every
call the widget makes to Zoho and what it got back; a red dot is a call that failed. You can send
the widget an event (`Notify`, `ContextUpdate`, …) from the bottom of the panel.

`zoho-studio z-crm:widgets:serve --widget=deal-card` does the same without the app: it prints an
address to open.

## Describe situations with scenarios

A scenario is one situation: a record, a user's answer from Zoho, an error. Write one file per
situation in `scenarios/` and list the answers you need under `mocks`, by SDK method name:

```ts
import { defineWidgetScenario } from '@zoho-studio/zoho-crm/widget'

export default defineWidgetScenario({
    pageLoad: { Entity: 'Deals', EntityId: '1000000000001' },
    mocks: {
        'API.updateRecord': ({ APIData }) => ({ data: [{ code: 'SUCCESS', details: { id: APIData.id } }] }),
    },
})
```

When the widget calls something the scenario does not answer and Zoho Studio has no default for,
the widget gets an error saying which method to add and where. Some SDK features — Deluge functions
(`FUNCTIONS.execute`), Blueprint, Wizard, ZRC — answer with an error saying Zoho Studio does not run
them.

## Test it

Add Playwright to the project once:

```bash
bun add -d @playwright/test
bunx playwright install chromium
```

Then, with the widget running:

```bash
bunx playwright test
```

`playwright.config.ts` starts Zoho Studio's emulator for you. Each test leaves its screenshots and
the list of SDK calls (`calls.json`) in `widgets/<name>/results/<test>/`; the HTML report is in
`widgets/.report/`. Keep both out of git — new projects already ignore them.

## For AI agents

New projects get a skill in `.claude/skills/zoho-crm-widget-testing/` that teaches an agent to
write scenarios, fixtures and tests and to report results with screenshots. In a project created
before, copy that folder from a new project made with `zoho-studio init`, and add these lines to
`.gitignore`:

```text
widgets/*/results/
widgets/.report/
test-results/
```

and `"widgets/**/*.ts", "playwright.config.ts"` to `include` in `tsconfig.json`.

More: [`z-crm:widgets:serve`](../technical/34-widgets-serve-command.md),
[`z-crm:widgets:make`](../technical/35-widgets-make-command.md).
