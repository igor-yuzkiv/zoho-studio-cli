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

## Testing a widget

1. **Check it runs.** Open its `url`; if nothing answers, ask the person to start it (or start it the
   way its project says).
2. **List the SDK calls.** Search the code at `source` (skip `node_modules`, `dist`, minified
   files) for `ZOHO.embeddedApp.on('<Event>'` (events it listens to), `ZOHO.CRM.<NS>.<method>(`
   (every call, with its arguments), and `zrc.` / `ZDK.` (not emulated). For each call note the
   method, the `Entity`, and what the code reads from the answer (`data[0].Deal_Name`).
3. **Decide what to mock.** Some methods always reject with `ZOHO_STUDIO_UNSUPPORTED`, whatever the
   scenario says: `FUNCTIONS.execute`, `EVENTS.dispatch`, `WIZARD.post`, `BLUEPRINT.proceed`,
   `API.getBluePrint`, `API.updateBluePrint`, approvals, `API.uploadFile`, `API.getFile`,
   `ACTION.*`, `zrc.*`, `ZDK.Client.*` — flows that depend on them cannot be tested locally; say so.
   **Everything else needs a mock**: records, `META.*`, `CONFIG.*`, even `UI.*` reject with
   `ZOHO_STUDIO_NO_MOCK` until mocked.
4. **Write the scenario** — what is true for a whole situation: the record the widget opens on,
   answers most tests share, mocks with logic. See `zoho-studio instructions z-crm:widgets:serve`
   for the format, the mock keys, and the answer shapes. Take field API names from
   `data/zoho-crm/modules/<Module>/fields/`; fill only what the widget reads, with realistic values,
   never personal data from a real organization.
5. **Write the tests** — one behavior each, from the user's side: what is shown, what the widget
   sends to Zoho after an action (assert the call's `args`), how it shows an error. Per-test changes
   go into `open({ mocks })` instead of a new scenario.
6. **Run** `bunx playwright test widgets/<name>`. The config starts `z-crm:widgets:serve` itself;
   the widget must be running. First time in a project: `bun add -d @playwright/test` and
   `bunx playwright install chromium` — they download packages and a browser, ask the person.
7. **Read the result.** A test failing on an SDK call: `widgets/<name>/results/<test>/calls.json`
   shows each call's key, `args`, and `error.code` (`ZOHO_STUDIO_NO_MOCK` names the method and the
   scenario file). Screenshots are next to it.

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
