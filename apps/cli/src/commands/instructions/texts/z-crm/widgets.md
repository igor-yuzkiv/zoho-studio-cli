# z-crm:widgets — testing widgets without Zoho

zoho-studio does not build or serve a widget. It runs a widget that is **already served
somewhere** (`zet run`, Vite, any static server) inside an emulated Zoho CRM page: the widget keeps
the real Zoho JS SDK v1.5, and the emulator answers it — `PageLoad`, every `ZOHO.CRM.*` call — from a
scenario and nothing else. Nothing in the widget's code changes. Tests run against mocks: they do
not prove the widget works in Zoho.

## The widget folder

```text
widgets/<name>/
  widget.json              # where the widget runs and where its code is
  scenarios/<scenario>.ts  # PageLoad data and mocked SDK answers
  tests/*.spec.ts          # Playwright tests with the widgetPage fixture
  results/<test>/          # written by the tests: calls.json, final.png, screenshots
```

```json
{ "url": "http://127.0.0.1:5000/app/widget.html", "location": "Custom Button", "defaultScenario": "default", "source": "../deal-card-widget/app" }
```

`url` (required) — the address the widget runs at. `source` — where its code is, relative to the
project or absolute, often outside it; the emulator does not read it, it tells you where to look.
No folder yet: `zoho-studio z-crm:widgets:make --name=<name> --url=<address> --source=<path>`.

## What the emulator covers

- **Not emulated, whatever the scenario says** — these always reject with `ZOHO_STUDIO_UNSUPPORTED`:
  `FUNCTIONS.execute`, `EVENTS.dispatch`, `WIZARD.post`, `BLUEPRINT.proceed`, `API.getBluePrint`,
  `API.updateBluePrint`, approvals, `API.uploadFile`, `API.getFile`, `ACTION.*`, `zrc.*`,
  `ZDK.Client.*`. A flow that depends on them cannot be tested locally.
- **Everything else answers only from a mock**: records, `META.*`, `CONFIG.*`, even `UI.*` reject
  with `ZOHO_STUDIO_NO_MOCK` until a scenario or a test mocks them. The emulator invents nothing.
- To find what a widget calls, search its code at `source` for `ZOHO.embeddedApp.on('<Event>'`,
  `ZOHO.CRM.<NS>.<method>(`, and `zrc.` / `ZDK.`.
- Field API names for mocked records: `data/zoho-crm/modules/<Module>/fields/`.
- Scenario format, mock keys, and the `args` each call arrives with:
  `zoho-studio instructions z-crm:widgets:serve`.

## Running the tests

`bunx playwright test widgets/<name>`. The project's `playwright.config.ts` starts
`z-crm:widgets:serve` itself; the widget must already run at its `url`. A project runs Playwright
after `bun add -d @playwright/test` and `bunx playwright install chromium` — both download (a
package, a browser). A test failing on an SDK call: `widgets/<name>/results/<test>/calls.json` shows
each call's key, `args`, and `error.code` (`ZOHO_STUDIO_NO_MOCK` names the method and the scenario
file); screenshots are next to it.

## Tests

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
})
```

- `open({ widget, scenario?, mocks? })` — a new session; waits until the widget registers. `mocks`
  replace the scenario's mocks of the same key for this test only; they are data, not functions.
- `frame` — the widget as a Playwright `FrameLocator`.
- `calls()`, `waitForCall(key, { timeout? })` — the session's call log.
- `emit(name, data?)` — sends `Notify`, `NotifyAndWait`, `ContextUpdate`, `DialerActive` or `Dial`.
- `screenshot(name)` — saves `widgets/<widget>/results/<test>/<name>.png`.

After each test the fixture writes `calls.json` and `final.png` and closes the session; parallel
tests do not see each other's calls. The fixture talks to `http://127.0.0.1:4610` by default
(`ZOHO_STUDIO_WIDGETS_URL` changes it). Playwright runs the tests in Node, not Bun.

## Looking at a widget by hand

`zoho-studio z-crm:widgets:serve --widget=<name> [--scenario=<s>]` prints an address to open;
`zoho-studio browser` → **Widgets** shows every SDK call live and sends events. If the page says the
widget did not register in 10 seconds: it is not running at its `url`, does not load the SDK, or
never calls `ZOHO.embeddedApp.init()`.
