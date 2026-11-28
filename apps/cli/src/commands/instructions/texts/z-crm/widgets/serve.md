# z-crm:widgets:serve

Starts the widget emulator on `127.0.0.1:4610` (`--port` to change). With `--widget <name>` (and
`--scenario`) it also opens a session and prints the address to open. Runs until Ctrl+C.

- **Writes to Zoho:** no — every SDK call is answered from the scenario. **Needs login:** no.

Playwright starts it through `webServer` in `playwright.config.ts`, so tests rarely need it run by
hand; to show a widget to the person, start it in the background. The process of testing a widget is
in `zoho-studio instructions z-crm:widgets`.

## Scenarios

```ts
import { defineWidgetScenario } from '@zoho-studio/zoho-crm/widget'

export default defineWidgetScenario({
    pageLoad: { Entity: 'Deals', EntityId: '1000000000001' },
    mocks: {
        'API.getRecord': { data: [{ id: '1000000000001', Deal_Name: 'Acme renewal', Amount: 1200 }] },
        'API.searchRecord': { data: [] },
        'API.updateRecord': ({ APIData }) => ({
            data: [{ code: 'SUCCESS', details: { id: APIData.id }, message: 'record updated', status: 'success' }],
        }),
        'API.deleteRecord': { $reject: { code: 'NO_PERMISSION', message: 'permission denied' } },
    },
})
```

- `pageLoad` is sent as written, once, after the widget registers — give it what the widget reads
  (`Entity`, `EntityId`, `ButtonPosition`, …).
- A mock value resolves the call; `{ $reject: value }` rejects it; a function receives the call's
  arguments and its return value is treated the same way, what it throws rejects. An `Error` is
  sent as `{ code: 'ZOHO_STUDIO_ERROR', message }`.
- Records: `id` as a string, fields by API name.
- The file is imported again for every session: an edit applies without a restart. Large or shared
  data can live in modules or JSON files the scenario imports.
- Under the compiled `zoho-studio` a scenario can import only `defineWidgetScenario` from
  `@zoho-studio/zoho-crm/widget`: the executable does not load the project's `node_modules`.

## Mock keys

A key is the method's path without `ZOHO.CRM.`: `ZOHO.CRM.API.updateRecord` → `'API.updateRecord'`,
`ZOHO.CRM.UI.Popup.closeReload` → `'UI.Popup.closeReload'`. The SDK does not send that name: each
call arrives as a `postMessage` with `category` and `type`/`action`, and the emulator maps the pair
back to the key (built from the SDK 1.5 source). Two cases depend on the arguments:
`getRecord`, `getAllRecords` and `getRelatedRecords` all send `category: 'READ'` — with `RecordID`
and `RelatedList` it is `API.getRelatedRecords`, with `RecordID` alone `API.getRecord`, without it
`API.getAllRecords`; `upsertRecord` is told from `insertRecord` by `APIData.action: 'UPSERT'`. The
call log shows the key each call got.

## SDK 1.5: Bootstrap

- Register every `ZOHO.embeddedApp.on(event, handler)` **before** `ZOHO.embeddedApp.init()`:
  the SDK attaches listeners only inside `init()`, later ones never fire.
- Events: `PageLoad`, `DialerActive`, `Dial`, `Notify`, `NotifyAndWait`, `ContextUpdate` (case-sensitive).
- Call `ZOHO.CRM.*` inside `PageLoad` (or after `init()` resolves).
- In Zoho, `PageLoad` data depends on the location: a record location sends `{ Entity, EntityId }`
  (a button may add `ButtonPosition`); Web Tab, Dashboard and Settings send less. A Dashboard
  widget may not get `PageLoad` at all.

## SDK 1.5: Methods → mock keys

Every method returns a promise. Answers in Zoho follow the v2 envelopes below; mocks should too.

| Mock key | Called as | Zoho answers |
|---|---|---|
| `API.getRecord` | `getRecord({ Entity, RecordID })` | `{ data: [record] }` |
| `API.getAllRecords` | `getAllRecords({ Entity, sort_order?, per_page?, page? })` | `{ data: [...], info: { more_records, ... } }` |
| `API.getRelatedRecords` | `getRelatedRecords({ Entity, RecordID, RelatedList, page?, per_page? })` (Zoho's docs also write `RelatedListAPIName`) | `{ data: [...], info }` |
| `API.insertRecord` | `insertRecord({ Entity, APIData, Trigger? })` | `{ data: [{ code, details: { id }, status }] }` |
| `API.updateRecord` | `updateRecord({ Entity, APIData: { id, ... }, Trigger? })` | `{ data: [{ code, details, status }] }` |
| `API.upsertRecord` | `upsertRecord({ Entity, APIData, duplicate_check_fields? })` | same as insert |
| `API.deleteRecord` | `deleteRecord({ Entity, RecordID })` | `{ data: [{ code, details, status }] }` |
| `API.searchRecord` | `searchRecord({ Entity, Type: 'email' \| 'phone' \| 'criteria' \| 'word', Query })` | `{ data, info }` |
| `API.coql` | `coql({ select_query })` | `{ data, info }` |
| `API.addNotes` | `addNotes({ Entity, RecordID, Title, Content })` | `{ data: [{ code, details }] }` |
| `API.attachFile` | `attachFile({ Entity, RecordID, File: { Name, Content } })` | `{ data: [{ code, details }] }` |
| `API.getUser` / `API.getAllUsers` | `getUser({ ID })` / `getAllUsers({ Type })` | `{ users: [...] }` |
| `API.getProfile` / `API.getAllProfiles` | `getProfile({ ID })` | `{ profiles: [...] }` |
| `API.getOrgVariable` | `getOrgVariable(name)` | `{ Success: { Content } }` |
| `META.getModules` | `getModules()` | `{ modules: [...] }` |
| `META.getFields` | `getFields({ Entity })` | `{ fields: [...] }` |
| `META.getLayouts` | `getLayouts({ Entity, Id? })` | `{ layouts: [...] }` |
| `META.getRelatedList` | `getRelatedList({ Entity })` | `{ related_lists: [...] }` |
| `META.getCustomViews` | `getCustomViews({ Entity, Id? })` | `{ custom_views: [...] }` |
| `CONFIG.getCurrentUser` | `getCurrentUser()` | the SDK's example: the user object itself (`{ id, full_name, email, role, profile, … }`); Zoho's docs: `{ users: [user] }` — mock the shape the widget reads |
| `CONFIG.getOrgInfo` | `getOrgInfo()` | `{ org: [org] }` |
| `CONFIG.getUserPreference` | `getUserPreference()` | not documented |
| `UI.Resize` | `Resize({ height, width })` | `true` |
| `UI.Popup.close` / `UI.Popup.closeReload` | `Popup.close()` | `true` |
| `UI.Record.open` / `.edit` / `.create` / `.populate` | `Record.open({ Entity, RecordID })` | `true` |
| `UI.Widget.open` | `Widget.open({ Entity, Message })` | `true` |
| `HTTP.get` / `.post` / `.put` / `.patch` / `.delete` | `HTTP.get({ url, params?, headers? })` | the external service's body |
| `CONNECTION.invoke` | `CONNECTION.invoke(name, { url, method, parameters?, headers? })` | the external service's body |
| `CONNECTOR.invokeAPI` / `.authorize` | `CONNECTOR.invokeAPI(nameSpace, data)` | the connector's body |

The `args` a mock receives — and that `calls.json` shows — are what the SDK sends for the call,
which is close to but not always the same as what the widget passed: `getRecord` arrives as
`{ APIData: { Entity, RecordID } }`, `updateRecord` as `{ type, Entity, APIData }`, `searchRecord`
as `{ Entity, Type, Query, ... }`, `addNotes` as `{ Entity, RelatedID, APIData: { data: [{ Note_Title,
Note_Content }] } }`, `UI.Record.open` as `{ action, data: { Entity, RecordID } }`. Check `calls.json` once and match on what is there.

## SDK 1.5: Errors

Zoho rejects with an object such as `{ code: 'INVALID_DATA', message, details }`; common codes:
`INVALID_MODULE`, `INVALID_DATA`, `MANDATORY_NOT_FOUND`, `NO_PERMISSION`, `INVALID_QUERY`.
Throw the same shape from a mock to test how the widget shows an error.

## SDK 1.5: Answer examples

Trimmed from the SDK's examples. Records carry many system fields (`Owner`, `Created_Time`,
`$approved`, …); a mock needs only the ones the widget reads.

```jsonc
// API.getRecord / API.getAllRecords
{ "data": [{ "id": "3000000040016", "Full_Name": "Naresh", "Company": "ZohoCorp", "Owner": { "name": "Naresh", "id": "3000000031045" } }],
  "info": { "per_page": 200, "count": 1, "page": 1, "more_records": false } }

// API.insertRecord / API.updateRecord / API.upsertRecord
{ "data": [{ "code": "SUCCESS", "details": { "id": "3000000040016", "Modified_Time": "2017-12-22T03:29:57+05:30" },
             "message": "record updated", "status": "success" }] }

// API.deleteRecord
{ "data": [{ "code": "SUCCESS", "details": { "id": "3000000040015" }, "message": "record deleted", "status": "success" }] }

// API.coql
{ "data": [{ "First_Name": null, "Last_Name": "Boyle", "id": "111118000000047003" }], "info": { "count": 1, "more_records": false } }

// META.getFields
{ "fields": [{ "api_name": "Owner", "field_label": "Contact Owner", "data_type": "ownerlookup", "custom_field": false, "visible": true }] }

// API.getOrgVariable
{ "Success": { "Content": "12345" } }

// CONNECTION.invoke
{ "code": "SUCCESS", "details": { "CODE": 200, "message": "action completed successfully", "status": "Success" },
  "message": "Connection invoked successfully", "status": "success" }

// HTTP.get / post / … — the external service's body, as it is
```

`UI.*` methods resolve with `true`.

Sources beyond this, when needed: the SDK source with an example answer for every method,
<https://github.com/zoho/embeddedApp-js-sdk/blob/1.5/lib/ZohoCrmHelper.js>, and Zoho's reference,
<https://developer.zoho.com/crm/explore/widgets/v1.5>.

## HTTP API

The harness page and the fixture use it; a request whose `Origin` is not the emulator's own is
refused with `403`. `GET /api/widgets`; `POST /api/sessions` `{ widget, scenario?, mocks? }`;
`GET|DELETE /api/sessions/:id`; `GET /api/sessions/:id/calls` — the call log
`[{ at, method, args, ok, response | error }]`; `POST /api/sessions/:id/events` `{ name, data }`.
