# `zoho-studio z-crm:widgets:serve`

Runs Zoho CRM widgets on your computer without Zoho. The widget keeps the real Zoho JS SDK v1.5
and runs at its own address — `zet run`, Vite, any static server; Zoho Studio plays the CRM page
around it and answers the SDK from a scenario, from the metadata pulled into `data/`, and from
fixtures. Nothing in the widget's code changes.

**The widget must already be running at the `url` in its `widget.json`.** Zoho Studio does not
build or serve the widget; it only opens it.

```bash
zoho-studio z-crm:widgets:serve                                    # the emulator on port 4610
zoho-studio z-crm:widgets:serve --widget=deal-card                 # also open a session and print its address
zoho-studio z-crm:widgets:serve -w deal-card -s saves -p 4700
```

```text
Widget emulator: http://127.0.0.1:4610
Open deal-card (saves): http://127.0.0.1:4610/harness/789e325b-1ed0-4646-b883-811c58d75a82
Press Ctrl+C to stop.
```

Open the printed address in a browser to see the widget. The same emulator serves the Playwright
fixture (see [e2e tests](#e2e-tests)) and the **Widgets** tab of [`browser`](25-browser-command.md).

## Options

- `-w, --widget <name>` — opens a session for `widgets/<name>/` and prints its address.
- `-s, --scenario <name>` — the scenario of that session; without it, `defaultScenario` from
  `widget.json`, and without that, no scenario (defaults only).
- `-p, --port <number>` — the port, `4610` by default. The emulator listens on `127.0.0.1` only.

## The widget folder

```text
widgets/<name>/
  widget.json
  scenarios/<scenario>.ts
  fixtures/<Module>.json
  tests/*.spec.ts
  results/<test>/            # written by the e2e tests
```

`widget.json`:

```json
{ "url": "http://127.0.0.1:5000/app/widget.html", "location": "Custom Button", "defaultScenario": "default" }
```

- `url` — required, the http(s) address the widget runs at. Its query and hash are kept.
- `location` — optional, one of `Dashboard`, `Web Tab`, `Custom Button`, `Custom Related List`,
  `Wizard`, `Signal`, `Settings`, `Blueprint`. It is shown in `browser`; it does not change what the
  widget receives.
- `defaultScenario` — optional, the scenario a session uses when none is named.

[`z-crm:widgets:make`](35-widgets-make-command.md) creates such a folder.

## How the CRM is emulated

The SDK talks to the CRM page around it through `postMessage` and trusts only the parent window
named by the `serviceOrigin` parameter of the widget's address. The emulator's page opens the
widget in an iframe with `serviceOrigin` set to itself, then:

1. answers the SDK's `REGISTER` with `SET_CONTEXT`, which resolves `ZOHO.embeddedApp.init()`;
2. sends `PageLoad` with the scenario's `pageLoad`, exactly as written;
3. answers every `ZOHO.CRM.*` call — from the scenario's mock, a default, or an error — and logs it.

If the widget does not register within 10 seconds, the page says so: the widget is not running at
its `url`, does not load the SDK, or never calls `ZOHO.embeddedApp.init()`.

## Scenarios

A scenario is a TypeScript file whose default export says what `PageLoad` carries and how SDK
methods answer:

```ts
import { defineWidgetScenario } from '@zoho-studio/zoho-crm/widget'

export default defineWidgetScenario({
    pageLoad: { Entity: 'Deals', EntityId: '1000000000001' },
    mocks: {
        'API.searchRecord': { data: [] },
        'API.updateRecord': ({ APIData }) => ({ data: [{ code: 'SUCCESS', details: { id: APIData.id } }] }),
        'API.deleteRecord': () => {
            throw { code: 'NO_PERMISSION', message: 'permission denied' }
        },
    },
})
```

A mock is keyed by the SDK method name. Data resolves the widget's promise; a function receives the
call's arguments, and what it returns resolves the promise, what it throws rejects it. An `Error`
is sent as `{ code: 'ZOHO_STUDIO_ERROR', message }`. The file is imported again for every session,
so an edit applies to the next one without a restart.

The arguments a mock receives are what the SDK sends, which is close to what the widget passed but
not always the same: `getRecord` arrives as `{ APIData: { Entity, RecordID } }`, `updateRecord` as
`{ type, Entity, APIData }`. The call log shows them.

Under the compiled `zoho-studio`, a scenario can import only `defineWidgetScenario` from
`@zoho-studio/zoho-crm/widget`: the executable does not load packages from the project's
`node_modules`, so it provides that one function itself.

## Answers without a mock

| Method | Answer |
|---|---|
| `META.getFields({ Entity })` | `{ fields }` from `data/zoho-crm/modules/<Entity>/fields/` |
| `META.getModules()` | `{ modules }`, every pulled module |
| `META.getLayouts({ Entity, Id? })` | `{ layouts }` from `data/zoho-crm/modules/<Entity>/layouts/` |
| `CONFIG.getOrgInfo()` | `{ org: [...] }` from `.zoho-studio/org.json` |
| `API.getRecord({ Entity, RecordID })` | `{ data: [record] }` from `fixtures/<Entity>.json`; a record not there is rejected with `ZOHO_STUDIO_NO_FIXTURE` |
| `API.getAllRecords({ Entity })` | `{ data, info }` from `fixtures/<Entity>.json` |
| `UI.*` | `true` |

A fixture is an array of records shaped as Zoho returns them. Metadata the widget reads must be
pulled first (`z-crm:modules:pull`, `z-crm:fields:pull`, `z-crm:layouts:pull`); a missing pull is
rejected with the command to run.

Any other method without a mock — including `HTTP.*`, `CONNECTION.invoke` and `CONNECTOR.*` — is
rejected with `{ code: 'ZOHO_STUDIO_NO_MOCK', message }`, where the message names the method and the
scenario file to add it to.

These are rejected with `ZOHO_STUDIO_UNSUPPORTED`, whatever the scenario says: `FUNCTIONS.execute`,
`EVENTS.dispatch`, `WIZARD.post`, `BLUEPRINT.proceed`, `API.getBluePrint`, `API.updateBluePrint`,
the approval methods, `API.uploadFile`, `API.getFile`, `ACTION.*`, `zrc.*` and `ZDK.Client.*`.

## Events

`PageLoad` is sent once, after the widget registers. The other five `embeddedApp` events —
`Notify`, `NotifyAndWait`, `ContextUpdate`, `DialerActive`, `Dial` — are sent on request: from the
e2e fixture (`widgetPage.emit`), from `browser`, or with `POST /api/sessions/:id/events`.

## E2E tests

`@zoho-studio/zoho-crm/widget-testing` adds a `widgetPage` fixture to the project's own Playwright
`test`. It imports no Playwright itself, so the project keeps one copy:

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

- `open({ widget, scenario? })` — opens the widget in a new session; it waits until the widget
  registers and fails with the emulator's message if it does not.
- `frame` — the widget, a Playwright `FrameLocator`.
- `calls()`, `waitForCall(method, { timeout? })` — the session's call log.
- `emit(name, data?)` — sends an event.
- `screenshot(name)` — saves `widgets/<widget>/results/<test>/<name>.png`.

After each test the fixture writes `calls.json` and `final.png` to the same folder and closes the
session. Each test has its own session, so tests running in parallel do not see each other's calls.

The fixture talks to an emulator that is already running, `http://127.0.0.1:4610` by default
(`createWidgetFixtures(base, { emulatorUrl })` or `ZOHO_STUDIO_WIDGETS_URL` to change it). Playwright
starts it through `webServer`, as the config `z-crm:widgets:make` writes does:

```ts
webServer: {
    command: 'zoho-studio z-crm:widgets:serve --port=4610',
    url: 'http://127.0.0.1:4610/api/widgets',
    reuseExistingServer: true,
},
```

Playwright runs tests in Node, not Bun; the fixture is written for that.

## HTTP API

The harness page and the fixture use it. A request that carries an `Origin` other than the
emulator's own — such as one from the widget — is refused with `403`.

| Method and path | Does |
|---|---|
| `GET /api/widgets` | the widgets in `widgets/` with their scenarios |
| `POST /api/sessions` | opens a session: `{ "widget": "deal-card", "scenario": "saves" }` → `{ id, widget, scenario, url }` |
| `GET /api/sessions/:id` | the session |
| `DELETE /api/sessions/:id` | closes it |
| `GET /api/sessions/:id/calls` | the call log: `[{ at, method, args, ok, response \| error }]` |
| `POST /api/sessions/:id/events` | sends an event: `{ "name": "Notify", "data": { … } }` |
| `GET /api/sessions/:id/stream` | server-sent events the harness forwards to the widget |
| `POST /api/sessions/:id/sdk` | answers one SDK message; the harness page calls it |
| `GET /harness/:id` | the page that hosts the widget |
