# Zoho CRM JS SDK 1.5 — what a widget calls and what it gets

Facts for writing mocks, so you do not need the network. Sources, when you need more:

- the SDK's source with an example answer for every method:
  <https://github.com/zoho/embeddedApp-js-sdk/blob/1.5/lib/ZohoCrmHelper.js> (release 1.5:
  <https://github.com/zoho/embeddedApp-js-sdk/releases/tag/1.5>);
- Zoho's reference per SDK version: <https://developer.zoho.com/crm/explore/widgets/v1.5>.

Zoho's examples are not always consistent; where they disagree, this file says so. When a widget
reads an answer in a way this file does not show, trust the widget's code and mock what it reads.

## Bootstrap

- Register every `ZOHO.embeddedApp.on(event, handler)` **before** `ZOHO.embeddedApp.init()`:
  the SDK attaches listeners only inside `init()`, later ones never fire.
- Events: `PageLoad`, `DialerActive`, `Dial`, `Notify`, `NotifyAndWait`, `ContextUpdate` (case-sensitive).
- Call `ZOHO.CRM.*` inside `PageLoad` (or after `init()` resolves).
- In Zoho, `PageLoad` data depends on the location: a record location sends `{ Entity, EntityId }`
  (a button may add `ButtonPosition`); Web Tab, Dashboard and Settings send less. A Dashboard
  widget may not get `PageLoad` at all.

## Methods → mock keys

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
as `{ Entity, Type, Query, ... }`. Check `calls.json` once and match on what is there.

## Errors

Zoho rejects with an object such as `{ code: 'INVALID_DATA', message, details }`; common codes:
`INVALID_MODULE`, `INVALID_DATA`, `MANDATORY_NOT_FOUND`, `NO_PERMISSION`, `INVALID_QUERY`.
Throw the same shape from a mock to test how the widget shows an error.

## Answer examples

Trimmed from the SDK's examples. Records carry many system fields (`Owner`, `Created_Time`,
`$approved`, …); a fixture needs only the ones the widget reads.

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
