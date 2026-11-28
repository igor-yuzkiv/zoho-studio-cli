# `zoho-studio z-crm:widgets:serve`

Runs Zoho CRM widgets on your computer without Zoho. The widget keeps the real Zoho JS SDK v1.5
and runs at its own address — `zet run`, Vite, any static server; Zoho Studio plays the CRM page
around it and answers the SDK from a scenario. Nothing in the widget's code changes.

**The widget runs at the `url` in its `widget.json`.** Zoho Studio does not build or serve it. If `widget.json` has a `run` command, the emulator starts the widget with it when the widget's first session opens; otherwise start the widget yourself.

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
fixture (see [e2e tests](#e2e-tests)) and the **Widgets** tab of [`browser`](../project/browser.md).

## Options

- `-w, --widget <name>` — opens a session for `widgets/<name>/` and prints its address.
- `-s, --scenario <name>` — the scenario of that session; without it, `defaultScenario` from
  `widget.json`, and without that, no scenario (every call is rejected).
- `-p, --port <number>` — the port, `4610` by default. The emulator listens on `127.0.0.1` only.

## The widget folder

```text
widgets/<name>/
  widget.json
  src/                       # the widget's code, when it lives here
  testing/
    scenarios/<scenario>.ts  # a situation: PageLoad and which mocks to use
    mocks/<mocks>.ts         # answers of SDK methods, shared by scenarios and tests
    tests/*.spec.ts
  results/<test>/            # written by the e2e tests
```

`widget.json`:

```json
{ "url": "http://127.0.0.1:5000/app/widget.html", "location": "Custom Button", "defaultScenario": "default", "run": { "command": "npm run dev" } }
```

- `url` — required, the http(s) address the widget runs at. Its query and hash are kept.
- `location` — optional, one of `Dashboard`, `Web Tab`, `Custom Button`, `Custom Related List`,
  `Wizard`, `Signal`, `Settings`, `Blueprint`. It is shown in `browser`; it does not change what the
  widget receives.
- `defaultScenario` — optional, the scenario a session uses when none is named.
- `source` — optional, where the widget's code is, relative to the widget folder or absolute — for a widget that lives outside the project. Without it, `src/` of the widget folder when there is one. Zoho Studio reads no code from it; it tells an agent where to look, and it is where `run` starts.
- `run` — optional, `{ "command": "<shell command>", "cwd": "<folder>" }`: how to start the widget. `cwd` is relative to the widget folder or absolute; without it, the `source` folder, and without that, the widget folder.

### Starting the widget

With `run`, the first session of a widget checks its `url`. If something answers, the widget is left alone — one you started yourself keeps running. If nothing answers, the emulator runs the command and waits up to 60 seconds for the `url` to answer; the session opens after that. A command that exits first, or does not make the `url` answer in time, fails the session with its last 20 lines of output. When the emulator stops — `Ctrl+C`, `SIGTERM` from Playwright, closing `browser` — it stops every widget it started, with everything the command started.

[`z-crm:widgets:make`](make.md) creates such a folder.

## How the CRM is emulated

The SDK talks to the CRM page around it through `postMessage` and trusts only the parent window
named by the `serviceOrigin` parameter of the widget's address. The emulator's page opens the
widget in an iframe with `serviceOrigin` set to itself, then:

1. answers the SDK's `REGISTER` with `SET_CONTEXT`, which resolves `ZOHO.embeddedApp.init()`;
2. sends `PageLoad` with the scenario's `pageLoad`, exactly as written;
3. answers every `ZOHO.CRM.*` call — from the scenario's mock or with an error — and logs it.

If the widget does not register within 10 seconds, the page says so: the widget is not running at
its `url`, does not load the SDK, or never calls `ZOHO.embeddedApp.init()`.

## Scenarios

A scenario is a file in `testing/scenarios/` whose default export says what `PageLoad` carries and which mocks answer the SDK. Mocks live in `testing/mocks/`, one file per set of answers, so several scenarios and tests share them:

```ts
// testing/mocks/saving.ts
import { defineWidgetMocks } from '@zoho-studio/zoho-crm/widget'

export default defineWidgetMocks({
    'API.searchRecord': { data: [] },
    'API.updateRecord': ({ APIData }) => ({ data: [{ code: 'SUCCESS', details: { id: APIData.id } }] }),
    'API.deleteRecord': () => {
        throw { code: 'NO_PERMISSION', message: 'permission denied' }
    },
})
```

```ts
// testing/scenarios/saves.ts
import { defineWidgetScenario } from '@zoho-studio/zoho-crm/widget'

export default defineWidgetScenario({
    pageLoad: { Entity: 'Deals', EntityId: '1000000000001' },
    use: ['record', 'saving'],
    mocks: {
        'API.getRecord': { data: [{ id: '1000000000001', Deal_Name: 'Acme renewal' }] },
    },
})
```

`use` names files of `testing/mocks/` without `.ts`. Mocks apply in this order, a later one replacing an earlier one of the same key: the files the scenario uses, in order; the scenario's own `mocks`; the files the test uses; the test's `mocks`. A name with no file fails the session with the path it looked for.

A mock is keyed by the SDK method name. Data resolves the widget's promise, and
`{ $reject: value }` rejects it with `value`; a function receives the call's arguments, and what it
returns is treated the same way, what it throws rejects the promise. An `Error`
is sent as `{ code: 'ZOHO_STUDIO_ERROR', message }`. Scenario and mocks files are imported again for every session, so an edit applies to the next one without a restart.

The arguments a mock receives are what the SDK sends, which is close to what the widget passed but
not always the same: `getRecord` arrives as `{ APIData: { Entity, RecordID } }`, `updateRecord` as
`{ type, Entity, APIData }`. The call log shows them.

### Mock keys

A mock key is the method's path in the SDK without `ZOHO.CRM.`: `ZOHO.CRM.API.updateRecord` is
`'API.updateRecord'`, `ZOHO.CRM.UI.Popup.closeReload` is `'UI.Popup.closeReload'`. Every public method
of SDK 1.5 has such a key.

The SDK does not send that name. Each call reaches the CRM page as a `postMessage` that carries
`category` with `type` or `action` — `updateRecord` sends `{ category: 'UPDATE', type: 'RECORD',
Entity, APIData }` — and the emulator turns that pair back into the method name. The table was
built from the SDK 1.5 source, so another SDK version may need it updated.

Two cases rest on the arguments rather than on `category` and `type`:

- `getRecord`, `getAllRecords` and `getRelatedRecords` all send `{ category: 'READ', APIData }`. A
  call with `RecordID` and `RelatedList` (or `RelatedListAPIName`) is `API.getRelatedRecords`, with
  `RecordID` alone `API.getRecord`, without it `API.getAllRecords`.
- `insertRecord` and `upsertRecord` both send `category: 'CREATE'`; `upsertRecord` is told apart by
  `APIData.action: 'UPSERT'`.

The call log shows the key each call got.

Under the compiled `zoho-studio`, scenario and mocks files can import only `defineWidgetScenario` and `defineWidgetMocks` from `@zoho-studio/zoho-crm/widget`: the executable does not load packages from the project's `node_modules`, so it provides those two functions itself.

## Without a mock

Zoho Studio answers nothing on its own. Every method the scenario or the test does not mock —
records, metadata, `CONFIG.*`, `UI.*`, `HTTP.*`, `CONNECTION.invoke`, `CONNECTOR.*` — is rejected
with `{ code: 'ZOHO_STUDIO_NO_MOCK', message }`, where the message names the method and the scenario file to add it to.

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

- `open({ widget, scenario?, use?, mocks? })` — opens the widget in a new session; it waits until the widget registers and fails with the emulator's message if it does not. `use` names files of `testing/mocks/` and `mocks` are inline answers; both replace the scenario's mocks of the same key for this test only, so a test needs no scenario file for one changed answer. Inline `mocks` are data: they cross from the test process, so a mock with logic goes into a file and is named in `use`.

  ```ts
  await widgetPage.open({
      widget: 'deal-card',
      use: ['empty-search'],
      mocks: { 'API.updateRecord': { $reject: { code: 'INVALID_DATA', message: 'invalid data' } } },
  })
  ```

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
    gracefulShutdown: { signal: 'SIGTERM', timeout: 5_000 },
},
```

Without `gracefulShutdown`, Playwright kills the emulator with `SIGKILL`, and widgets started by `run` keep running.

Playwright runs tests in Node, not Bun; the fixture is written for that.

## HTTP API

The harness page and the fixture use it. A request that carries an `Origin` other than the
emulator's own — such as one from the widget — is refused with `403`.

| Method and path | Does |
|---|---|
| `GET /api/widgets` | the widgets in `widgets/` with their scenarios |
| `POST /api/sessions` | opens a session: `{ "widget": "deal-card", "scenario": "saves", "use": ["empty-search"], "mocks": { … } }` → `{ id, widget, scenario, url }`; all but `widget` are optional. With `run` in `widget.json`, it answers once the widget does |
| `GET /api/sessions/:id` | the session |
| `DELETE /api/sessions/:id` | closes it |
| `GET /api/sessions/:id/calls` | the call log: `[{ at, method, args, ok, response \| error }]` |
| `POST /api/sessions/:id/events` | sends an event: `{ "name": "Notify", "data": { … } }` |
| `GET /api/sessions/:id/stream` | server-sent events the harness forwards to the widget |
| `POST /api/sessions/:id/sdk` | answers one SDK message; the harness page calls it |
| `GET /harness/:id` | the page that hosts the widget |
