# Widgets

Zoho Studio runs your Zoho CRM widgets on your computer, without Zoho: you open a widget, it gets a
record and answers to its SDK calls, and you see what it does — by hand or in automated tests with
screenshots. You build the widget your usual way; nothing in its code changes.

**Your widget runs at its own address** — with `zet run`, a dev server, or any static server. Zoho Studio opens it there and plays Zoho CRM around it. Give it the command that starts the widget, and Zoho Studio starts it when needed.

## Add a widget

```bash
zoho-studio z-crm:widgets:make --name=deal-card --url=http://127.0.0.1:5000/app/widget.html --module=Deals --run="npm run dev"
```

This creates `widgets/deal-card/` with:

- `widget.json` — where the widget runs, where its code is, and how to start it;
- `testing/scenarios/default.ts` — which record the widget opens on;
- `testing/mocks/record.ts` — how Zoho answers reading that record;
- `testing/tests/deal-card.spec.ts` — an automated test.

Put the widget's code in `widgets/deal-card/src/`: the run command starts there. A widget that lives elsewhere — another repository, a shared folder — stays where it is: pass `--source=<path to its folder>` instead.

Zoho Studio answers nothing on its own: every SDK call the widget makes — reading a record, its
fields, the org, even `UI.Resize` — needs an answer in the scenario.

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

A scenario is one situation: a record, a user, an error. Answers from Zoho live separately, in `testing/mocks/`, by SDK method name, so several scenarios and tests share them:

```ts
// testing/mocks/saving.ts
import { defineWidgetMocks } from '@zoho-studio/zoho-crm/widget'

export default defineWidgetMocks({
    'API.updateRecord': ({ APIData }) => ({ data: [{ code: 'SUCCESS', details: { id: APIData.id } }] }),
})
```

A scenario in `testing/scenarios/` names the record and the mocks it uses:

```ts
// testing/scenarios/saves.ts
import { defineWidgetScenario } from '@zoho-studio/zoho-crm/widget'

export default defineWidgetScenario({
    pageLoad: { Entity: 'Deals', EntityId: '1000000000001' },
    use: ['record', 'saving'],
})
```

A test can change an answer for itself without a new scenario: `widgetPage.open({ widget: 'deal-card', use: ['empty-search'] })` or `mocks: { 'API.searchRecord': { data: [] } }`; `{ $reject: { … } }` as the answer makes the call fail, the way an error from Zoho does.

When the widget calls something the scenario does not answer, the widget gets an error saying which method to add and where. Some SDK features — Deluge functions
(`FUNCTIONS.execute`), Blueprint, Wizard, ZRC — answer with an error saying Zoho Studio does not run
them.

## Test it

Add Playwright to the project once:

```bash
bun add -d @playwright/test
bunx playwright install chromium
```

Then:

```bash
bunx playwright test
```

`playwright.config.ts` starts Zoho Studio's emulator for you, and the emulator starts the widget with its run command; without one, start the widget first. Each test leaves its screenshots and
the list of SDK calls (`calls.json`) in `widgets/<name>/results/<test>/`; the HTML report is in
`widgets/.report/`. Keep both out of git — new projects already ignore them.

## For AI agents

The `widget-add` skill of the [Claude Code plugin](claude-code-plugin.md) adds a widget to the project or creates a new one on Vue, React or plain HTML that runs here and packs with Zoho's `zet`: ask the agent to add or create a widget, or run `/zoho-studio:widget-add`. The `widget-testing` skill teaches an agent to write scenarios and tests and to report results with screenshots: ask the agent to test a widget, or run `/zoho-studio:widget-testing`. A project created by an older `zoho-studio init` has its own copy of that skill in `.claude/skills/zoho-crm-widget-testing/`; it no longer matches the CLI, so delete the folder. In a project created before widget testing existed, add these lines to `.gitignore`:

```text
widgets/*/results/
widgets/.report/
test-results/
```

and `"widgets/**/*.ts", "playwright.config.ts"` to `include` in `tsconfig.json`.

More: [`z-crm:widgets:serve`](../reference/crm-widgets/serve.md),
[`z-crm:widgets:make`](../reference/crm-widgets/make.md).
