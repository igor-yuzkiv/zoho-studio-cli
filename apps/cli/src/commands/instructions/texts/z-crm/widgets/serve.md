# z-crm:widgets:serve

Starts the widget emulator on `127.0.0.1:4610` (`--port` to change). With `--widget <name>` (and
`--scenario`) it also opens a session and prints the address to open. A widget with `run` in its
`widget.json` is started at its first session and stopped with the emulator. Runs until Ctrl+C or
SIGTERM.

- **Writes to Zoho:** no — every SDK call is answered from the scenario. **Needs login:** no.

Playwright starts it through `webServer` in `playwright.config.ts`, so tests rarely need it run by
hand; to show a widget to the person, start it in the background. What the emulator covers and how
to run the tests is in `zoho-studio instructions z-crm:widgets`; the steps of testing a widget with
the person are the `widget-testing` skill of the zoho-studio plugin.

## Scenarios and mocks

```ts
// widgets/<name>/testing/mocks/saving.ts — answers, shared by scenarios and tests
import { defineWidgetMocks } from '@zoho-studio/zoho-crm/widget'

export default defineWidgetMocks({
    'API.searchRecord': { data: [] },
    'API.updateRecord': ({ APIData }) => ({
        data: [{ code: 'SUCCESS', details: { id: APIData.id }, message: 'record updated', status: 'success' }],
    }),
    'API.deleteRecord': { $reject: { code: 'NO_PERMISSION', message: 'permission denied' } },
})
```

```ts
// widgets/<name>/testing/scenarios/saves.ts — a situation
import { defineWidgetScenario } from '@zoho-studio/zoho-crm/widget'

export default defineWidgetScenario({
    pageLoad: { Entity: 'Deals', EntityId: '1000000000001' },
    use: ['record', 'saving'],
    mocks: { 'API.getRecord': { data: [{ id: '1000000000001', Deal_Name: 'Acme renewal', Amount: 1200 }] } },
})
```

- Order, a later one replacing an earlier one of the same key: the scenario's `use` files in
  order, the scenario's `mocks`, the test's `use`, the test's `mocks`. A `use` name with no file
  fails the session with the path it looked for.

- `pageLoad` is sent as written, once, after the widget registers — give it what the widget reads
  (`Entity`, `EntityId`, `ButtonPosition`, …).
- A mock value resolves the call; `{ $reject: value }` rejects it; a function receives the call's
  arguments and its return value is treated the same way, what it throws rejects. An `Error` is
  sent as `{ code: 'ZOHO_STUDIO_ERROR', message }`.
- Records: `id` as a string, fields by API name.
- Scenario and mocks files are imported again for every session: an edit applies without a restart.
- Under the compiled `zoho-studio` these files can import only `defineWidgetScenario` and
  `defineWidgetMocks` from `@zoho-studio/zoho-crm/widget`: the executable does not load the
  project's `node_modules`.

## Mock keys

A key is the method's path without `ZOHO.CRM.`: `ZOHO.CRM.API.updateRecord` → `'API.updateRecord'`,
`ZOHO.CRM.UI.Popup.closeReload` → `'UI.Popup.closeReload'`. The SDK does not send that name: each
call arrives as a `postMessage` with `category` and `type`/`action`, and the emulator maps the pair
back to the key (built from the SDK 1.5 source). Two cases depend on the arguments:
`getRecord`, `getAllRecords` and `getRelatedRecords` all send `category: 'READ'` — with `RecordID`
and `RelatedList` it is `API.getRelatedRecords`, with `RecordID` alone `API.getRecord`, without it
`API.getAllRecords`; `upsertRecord` is told from `insertRecord` by `APIData.action: 'UPSERT'`. The
call log shows the key each call got.

## Methods → mock keys

The SDK 1.5 methods the emulator recognizes. A mock answers with the shape Zoho would send — see
Zoho's widget SDK reference for each method.

| Mock key | Called as |
|---|---|
| `API.getRecord` | `getRecord({ Entity, RecordID })` |
| `API.getAllRecords` | `getAllRecords({ Entity, sort_order?, per_page?, page? })` |
| `API.getRelatedRecords` | `getRelatedRecords({ Entity, RecordID, RelatedList, page?, per_page? })` (Zoho's docs also write `RelatedListAPIName`) |
| `API.insertRecord` | `insertRecord({ Entity, APIData, Trigger? })` |
| `API.updateRecord` | `updateRecord({ Entity, APIData: { id, ... }, Trigger? })` |
| `API.upsertRecord` | `upsertRecord({ Entity, APIData, duplicate_check_fields? })` |
| `API.deleteRecord` | `deleteRecord({ Entity, RecordID })` |
| `API.searchRecord` | `searchRecord({ Entity, Type: 'email' \| 'phone' \| 'criteria' \| 'word', Query })` |
| `API.coql` | `coql({ select_query })` |
| `API.addNotes` | `addNotes({ Entity, RecordID, Title, Content })` |
| `API.attachFile` | `attachFile({ Entity, RecordID, File: { Name, Content } })` |
| `API.getUser` / `API.getAllUsers` | `getUser({ ID })` / `getAllUsers({ Type })` |
| `API.getProfile` / `API.getAllProfiles` | `getProfile({ ID })` |
| `API.getOrgVariable` | `getOrgVariable(name)` |
| `META.getModules` | `getModules()` |
| `META.getFields` | `getFields({ Entity })` |
| `META.getLayouts` | `getLayouts({ Entity, Id? })` |
| `META.getRelatedList` | `getRelatedList({ Entity })` |
| `META.getCustomViews` | `getCustomViews({ Entity, Id? })` |
| `CONFIG.getCurrentUser` | `getCurrentUser()` |
| `CONFIG.getOrgInfo` | `getOrgInfo()` |
| `CONFIG.getUserPreference` | `getUserPreference()` |
| `UI.Resize` | `Resize({ height, width })` |
| `UI.Popup.close` / `UI.Popup.closeReload` | `Popup.close()` |
| `UI.Record.open` / `.edit` / `.create` / `.populate` | `Record.open({ Entity, RecordID })` |
| `UI.Widget.open` | `Widget.open({ Entity, Message })` |
| `HTTP.get` / `.post` / `.put` / `.patch` / `.delete` | `HTTP.get({ url, params?, headers? })` |
| `CONNECTION.invoke` | `CONNECTION.invoke(name, { url, method, parameters?, headers? })` |
| `CONNECTOR.invokeAPI` / `.authorize` | `CONNECTOR.invokeAPI(nameSpace, data)` |

The `args` a mock receives — and that `calls.json` shows — are what the SDK sends for the call,
which is close to but not always the same as what the widget passed: `getRecord` arrives as
`{ APIData: { Entity, RecordID } }`, `updateRecord` as `{ type, Entity, APIData }`, `searchRecord`
as `{ Entity, Type, Query, ... }`, `addNotes` as `{ Entity, RelatedID, APIData: { data: [{ Note_Title,
Note_Content }] } }`, `UI.Record.open` as `{ action, data: { Entity, RecordID } }`. Check `calls.json` once and match on what is there.

## Rejections

A mock rejects with `{ $reject: value }` or by throwing. Give it the shape Zoho rejects with —
`{ code, message, details }` — to test how the widget shows an error.

## HTTP API

The harness page and the fixture use it; a request whose `Origin` is not the emulator's own is
refused with `403`. `GET /api/widgets`; `POST /api/sessions` `{ widget, scenario?, use?, mocks? }`;
`GET|DELETE /api/sessions/:id`; `GET /api/sessions/:id/calls` — the call log
`[{ at, method, args, ok, response | error }]`; `POST /api/sessions/:id/events` `{ name, data }`.
