---
name: zoho-crm-widget-testing
description: Run, mock and test Zoho CRM widgets locally with Zoho Studio — scenarios, fixtures, Playwright e2e tests with screenshots and an SDK call log. Use when the user asks to run a widget without Zoho, test or debug a widget, write or fix a widget scenario, fixture or e2e test, or check which Zoho JS SDK calls a widget makes.
---

# Testing Zoho CRM widgets with Zoho Studio

Zoho Studio does not tell you how to build a widget. It runs a widget that is **already served
somewhere** (`zet run`, Vite, any static server) inside an emulated Zoho CRM: the widget keeps
the real Zoho JS SDK v1.5, and Zoho Studio answers it — `PageLoad`, `ZOHO.CRM.*` calls — from a
scenario, from metadata pulled into `data/`, and from fixtures. Nothing in the widget's code
changes.

## Layout

```text
widgets/<name>/
  widget.json            # { "url": "http://127.0.0.1:5000/app/widget.html", "location": "Custom Button", "defaultScenario": "default" }
  scenarios/<scenario>.ts  # what PageLoad carries and how SDK methods answer
  fixtures/<Module>.json   # records API.getRecord / API.getAllRecords answer with (an array)
  tests/<name>.spec.ts     # Playwright tests
  results/<test>/          # written by the tests: screenshots, calls.json (git-ignored)
playwright.config.ts     # starts the emulator through webServer
```

Start a new widget with `zoho-studio z-crm:widgets:make --name=<name> --url=<address> [--location=<type>] [--module=<api_name>]`.
It creates all of the above with a working example; it refuses a name that exists.

## Scenarios

```ts
import { defineWidgetScenario } from '@zoho-studio/zoho-crm/widget'

export default defineWidgetScenario({
    pageLoad: { Entity: 'Deals', EntityId: '1000000000001' },
    mocks: {
        // data resolves the widget's promise
        'API.searchRecord': { data: [] },
        // a function gets the call's arguments; throwing rejects the promise
        'API.updateRecord': ({ APIData }) => ({ data: [{ code: 'SUCCESS', details: { id: APIData.id } }] }),
        'API.deleteRecord': () => {
            throw { code: 'NO_PERMISSION', message: 'permission denied' }
        },
    },
})
```

- Keys are SDK method names: `API.getRecord`, `META.getFields`, `CONFIG.getCurrentUser`, `UI.Resize`,
  `HTTP.get`, `CONNECTION.invoke`. The full list is in `references/sdk-1.5.md`.
- `pageLoad` is sent as is. Zoho Studio does not invent it per location: give it the fields the
  widget reads (`Entity`, `EntityId`, `ButtonPosition`, …).
- One scenario per situation you want to see (empty record, error from Zoho, read-only user).

### Defaults when a method is not mocked

| Method | Answer |
|---|---|
| `META.getFields({Entity})` | `{ fields }` from `data/zoho-crm/modules/<Entity>/fields/` |
| `META.getModules()` | `{ modules }` from every pulled module |
| `META.getLayouts({Entity})` | `{ layouts }` from `data/zoho-crm/modules/<Entity>/layouts/` |
| `CONFIG.getOrgInfo()` | `{ org: [...] }` from `.zoho-studio/org.json` |
| `API.getRecord({Entity, RecordID})` | `{ data: [record] }` from `fixtures/<Entity>.json`, or a rejection naming the missing record |
| `API.getAllRecords({Entity})` | `{ data, info }` from `fixtures/<Entity>.json` |
| `UI.*` | `true` |
| anything else | rejected with `ZOHO_STUDIO_NO_MOCK` and the file to add the mock to |

Pull metadata first (`z-crm:modules:pull`, `z-crm:fields:pull --module=<M>`, `z-crm:layouts:pull --module=<M>`)
when the widget reads it.

**Not supported yet** — rejected with `ZOHO_STUDIO_UNSUPPORTED`, not with "no mock":
`FUNCTIONS.execute`, `zrc.*`, Blueprint, Wizard, approvals, file upload/download, `ZDK.Client.*`.
Say so to the user instead of trying to mock them.

## Fixtures

`fixtures/<Module>.json` is an array of records shaped as Zoho returns them (`id` as a string,
fields by API name). Use real field API names from `data/zoho-crm/modules/<Module>/fields/`.
Generate realistic values; never copy personal data from a real org into fixtures.

## E2E tests

```ts
import { test as base, expect } from '@playwright/test'
import { createWidgetFixtures } from '@zoho-studio/zoho-crm/widget-testing'

const test = createWidgetFixtures(base)

test('saves the review', async ({ widgetPage }) => {
    await widgetPage.open({ widget: 'deal-card', scenario: 'saves' })

    await widgetPage.frame.getByRole('button', { name: 'Mark as reviewed' }).click()
    const call = await widgetPage.waitForCall('API.updateRecord')
    expect(call.args).toMatchObject({ Entity: 'Deals' })
    await widgetPage.screenshot('saved')
})
```

- `widgetPage.open({ widget, scenario })` opens a fresh session — its own call log.
- `widgetPage.frame` is the widget (a Playwright `FrameLocator`); assert on what the user sees.
- `widgetPage.waitForCall(method)`, `widgetPage.calls()` — the SDK call log; assert the arguments
  the widget sent, not only the screen.
- `widgetPage.emit('Notify', data)` sends one of the six `embeddedApp` events.
- `widgetPage.screenshot(name)` saves `results/<test>/<name>.png`. After every test the fixture also
  writes `results/<test>/calls.json` and `final.png`.

Each test should check one behavior of the widget from the user's side: what is shown for a
scenario, what the widget sends to Zoho after an action, how it shows an error from Zoho.

Run: `bunx playwright test` (the config starts `zoho-studio z-crm:widgets:serve` and the widget's
own server if you add it to `webServer`). The widget itself must be running at its `url`.

## Reporting results

After a run, report to the user: which tests passed or failed, the path of every screenshot that
shows the behavior in question, and — for failures — the relevant entries of `calls.json`
(method, args, ok, error). Do not claim a widget works in Zoho from these tests alone: they run
against an emulator and fixtures.

## Looking at a widget by hand

- `zoho-studio browser` → **Widgets**: pick a widget and scenario, **Open**; the SDK calls panel
  shows every call and its answer live, and you can send events.
- `zoho-studio z-crm:widgets:serve --widget=<name> [--scenario=<s>]` prints a harness address to open.

If the harness says the widget did not answer in 10 s: the widget is not running at its `url`,
it does not load the SDK, or it never calls `ZOHO.embeddedApp.init()`.
