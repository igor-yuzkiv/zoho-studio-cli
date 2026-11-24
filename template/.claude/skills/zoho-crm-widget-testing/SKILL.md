---
name: zoho-crm-widget-testing
description: Test Zoho CRM widgets locally with Zoho Studio — find the SDK calls a widget makes, mock them with scenarios and fixtures, run Playwright e2e tests with screenshots and an SDK call log. Use when the user asks to test, run or debug a widget without Zoho, and on your own before saying a change to a widget's code is done.
---

# Testing Zoho CRM widgets with Zoho Studio

Zoho Studio does not tell you how to build a widget. It runs a widget that is **already served
somewhere** (`zet run`, Vite, any static server) inside an emulated Zoho CRM: the widget keeps the
real Zoho JS SDK v1.5, and Zoho Studio answers it — `PageLoad`, `ZOHO.CRM.*` calls — from a scenario,
from metadata pulled into `data/`, and from fixtures. Nothing in the widget's code changes.

## When to use

- The user asks to test a widget, a flow in it, or how it handles an answer from Zoho.
- **As a gate:** you changed a widget's code — run its tests (and add one for the change) before
  you report the change as done.

## The process

### 1. Find the widget

`widgets/<name>/widget.json`:

```json
{ "url": "http://127.0.0.1:5000/app/widget.html", "location": "Custom Button", "defaultScenario": "default", "source": "../deal-card-widget/app" }
```

`source` is where the widget's code is — relative to the project or absolute, often outside it.
No `widget.json` yet: create one with
`zoho-studio z-crm:widgets:make --name=<name> --url=<address> --source=<path> [--location=<type>] [--module=<api_name>]`
(it refuses a name that exists). No `source` and you do not know where the code is: ask the user,
and add it to `widget.json`.

Check the widget answers at its `url`; if not, ask the user to start it (or start it the way its
project says).

### 2. List the SDK calls the code makes

Search the code at `source` (skip `node_modules`, `dist`, minified files) for:

- `ZOHO.embeddedApp.on('<Event>'` — which events it listens to;
- `ZOHO.CRM.<NS>.<method>(` — every SDK call, with the arguments it passes;
- `zrc.` and `ZDK.` — calls Zoho Studio does not run (see step 3).

Note for each call: the method, the `Entity` it uses, and what the code reads from the answer
(`data[0].Deal_Name`, `fields.length`, …). `references/sdk-1.5.md` has every method with the
arguments the mock receives and the answer shape Zoho sends.

### 3. Decide what is covered and what to mock

For each call, in this order:

1. **Unsupported** — `FUNCTIONS.execute`, `zrc.*`, `ZDK.Client.*`, Blueprint, Wizard, approvals,
   `uploadFile`/`getFile`, `EVENTS.dispatch`. These always reject with `ZOHO_STUDIO_UNSUPPORTED`; a
   mock does not change that. Tell the user which flows cannot be tested locally because of them.
2. **Answered by default** — when nothing mocks them:

   | Method | Answer |
   |---|---|
   | `META.getFields({Entity})` | `{ fields }` from `data/zoho-crm/modules/<Entity>/fields/` |
   | `META.getModules()` | `{ modules }` from every pulled module |
   | `META.getLayouts({Entity})` | `{ layouts }` from `data/zoho-crm/modules/<Entity>/layouts/` |
   | `CONFIG.getOrgInfo()` | `{ org: [...] }` from `.zoho-studio/org.json` |
   | `API.getRecord({Entity, RecordID})` | `{ data: [record] }` from `fixtures/<Entity>.json`, or a rejection naming the missing record |
   | `API.getAllRecords({Entity})` | `{ data, info }` from `fixtures/<Entity>.json` |
   | `UI.*` | `true` |

   Metadata must be pulled: `z-crm:modules:pull`, `z-crm:fields:pull --module=<M>`,
   `z-crm:layouts:pull --module=<M>`. These talk to Zoho — ask the user before running them.
3. **Everything else needs a mock** — otherwise it rejects with `ZOHO_STUDIO_NO_MOCK`.

Then decide where each mock lives:

- **Scenario** (`scenarios/<name>.ts`) — what is true for a whole situation: the record the widget
  opens on, the answers most tests share, mocks that need logic (a function of the arguments).
- **Test** (`widgetPage.open({ ..., mocks })`) — what one test case changes: an empty search, an
  error from Zoho. Data only; `{ $reject: value }` rejects.

Prefer one `default` scenario plus per-test overrides; add a scenario when a situation needs its
own record or logic.

### 4. Write scenarios and fixtures

```ts
import { defineWidgetScenario } from '@zoho-studio/zoho-crm/widget'

export default defineWidgetScenario({
    pageLoad: { Entity: 'Deals', EntityId: '1000000000001' },
    mocks: {
        'API.searchRecord': { data: [] },
        'API.updateRecord': ({ APIData }) => ({ data: [{ code: 'SUCCESS', details: { id: APIData.id }, message: 'record updated', status: 'success' }] }),
        'API.deleteRecord': { $reject: { code: 'NO_PERMISSION', message: 'permission denied' } },
    },
})
```

- Keys are SDK method names (`API.getRecord`, `META.getFields`, `CONFIG.getCurrentUser`, `HTTP.get`, …).
- A value is the answer; a function gets the call's arguments; `{ $reject: value }` or `throw` rejects.
- `pageLoad` is sent as is — give it what the widget reads (`Entity`, `EntityId`, `ButtonPosition`, …).
- Answers follow Zoho's shapes in `references/sdk-1.5.md`, so the widget reads them as in Zoho.

`fixtures/<Module>.json` is an array of records: `id` as a string, fields by API name. Take field
names from `data/zoho-crm/modules/<Module>/fields/` and fill only what the widget reads, with
realistic values. Never copy personal data from a real org.

### 5. Write the tests

```ts
import { test as base, expect } from '@playwright/test'
import { createWidgetFixtures } from '@zoho-studio/zoho-crm/widget-testing'

const test = createWidgetFixtures(base)

test('shows the deal', async ({ widgetPage }) => {
    await widgetPage.open({ widget: 'deal-card' })
    await expect(widgetPage.frame.getByRole('heading')).toHaveText('Acme renewal')
    await widgetPage.screenshot('opened')
})

test('shows Zoho rejecting the save', async ({ widgetPage }) => {
    await widgetPage.open({
        widget: 'deal-card',
        mocks: { 'API.updateRecord': { $reject: { code: 'INVALID_DATA', message: 'invalid data' } } },
    })
    await widgetPage.frame.getByRole('button', { name: 'Save' }).click()
    await expect(widgetPage.frame.getByRole('alert')).toContainText('invalid data')
    const call = await widgetPage.waitForCall('API.updateRecord')
    expect(call.args).toMatchObject({ Entity: 'Deals' })
    await widgetPage.screenshot('rejected')
})
```

One test, one behavior, seen from the user's side: what is shown for a situation, what the widget
sends to Zoho after an action (assert `args` in the call log), how it shows an error.

`widgetPage`: `open({ widget, scenario?, mocks? })`, `frame` (the widget, a `FrameLocator`),
`calls()`, `waitForCall(method)`, `emit(event, data)` for `Notify`, `ContextUpdate` and the other
events, `screenshot(name)`.

### 6. Run

```bash
bunx playwright test widgets/<name>
```

`playwright.config.ts` starts `zoho-studio z-crm:widgets:serve` through `webServer`; the widget must
be running at its `url`. First time in a project: `bun add -d @playwright/test` and
`bunx playwright install chromium` (ask the user — they download packages and a browser).

A test that fails on an SDK call: read `widgets/<name>/results/<test>/calls.json` — a rejected call
shows `error.code` (`ZOHO_STUDIO_NO_MOCK` names the method and file) and the `args` the widget sent.

### 7. Report

Tell the user: which tests passed and failed; the screenshot paths that show the behavior
(`widgets/<name>/results/<test>/*.png`); for a failure, the relevant `calls.json` entries; which
calls could not be tested because Zoho Studio does not run them. Say that the tests ran against an
emulator and fixtures — they do not prove the widget works in Zoho.

## Looking at a widget by hand

- `zoho-studio browser` → **Widgets**: pick a widget and scenario, **Open**; the SDK calls panel
  shows each call and its answer live and sends events.
- `zoho-studio z-crm:widgets:serve --widget=<name> [--scenario=<s>]` prints an address to open.

If the emulator says the widget did not answer in 10 s: it is not running at its `url`, does not
load the SDK, or never calls `ZOHO.embeddedApp.init()`.
