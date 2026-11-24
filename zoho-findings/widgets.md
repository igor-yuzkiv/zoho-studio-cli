# Widgets (Zoho CRM JS SDK 1.5)

## The SDK trusts the parent named by `serviceOrigin`, not a Zoho domain

- **Observed:** 2026-11-24, reading `live.zwidgets.com/js-sdk/1.5/ZohoEmbededAppSDK.min.js`;
  confirmed with a widget run in the emulator under Playwright (ZS-83)
- **Spec says:** not documented; the widget docs say the SDK works only inside Zoho CRM
- **Actually:** the SDK reads `serviceOrigin` from its own page's query string and accepts
  messages only from `window.parent` with exactly that origin. There is no check for a Zoho
  domain. Its handshake: the SDK posts `{ type: 'SDK.EVENT', eventName: 'REGISTER' }` when
  `ZOHO.embeddedApp.init()` runs; the parent answers
  `{ type: 'FRAMEWORK.EVENT', eventName: 'SET_CONTEXT', data: { uniqueID, connectors, model } }`,
  which resolves `init()`; any other `FRAMEWORK.EVENT` (e.g. `PageLoad`) calls the `on()` listeners
  with its `data`
- **In our code:** the widget emulator opens the widget with `serviceOrigin` set to itself and plays
  that parent (`entities/widget/emulator`)

## The SDK reads `serviceOrigin` from everything after the first `?`, hash included

- **Observed:** 2026-11-24, a Vite widget with a hash router run in the emulator: SDK 1.5 threw
  "Parentwindow reference not found" on every `ZOHO.CRM.*` call (ZS-83)
- **Spec says:** not documented
- **Actually:** the SDK splits `window.location.href` after the first `?` on `&`, with no regard to
  `#`. In `http://host/app/?serviceOrigin=X#/routes/shifts` the value becomes `X#/routes/shifts`, no
  parent matches it, `SET_CONTEXT` is ignored and the parent reference stays unset
- **Assumed:** Zoho CRM appends its parameters to the end of the widget URL, after any hash, which
  is why hash-router widgets work there
- **In our code:** `widgetUrlWithServiceOrigin` appends `serviceOrigin` at the very end of the
  address, with `?` or `&` depending on whether the address already has a `?`

## `ZOHO.CRM.*` calls arrive as one message type with a category

- **Observed:** 2026-11-24, SDK 1.5 source, checked with the emulator (ZS-83)
- **Spec says:** not documented
- **Actually:** every method posts `{ type: 'SDK.EVENT', eventName: 'CRM_EVENT', promiseid, data }`
  where `data.category` is `READ`, `CREATE`, `UPDATE`, `DELETE`, `SEARCH`, `QUERY`, `META`, `USER`,
  `CONFIG`, `UI`, `CONNECTOR` (also `HTTP.*`, as `nameSpace: 'wget.<verb>'`), `CRM_CONNECTION`,
  `FUNCTIONS_EXECUTE`, `ZRC_REQUEST`, … with method-specific fields. `getRecord`, `getAllRecords`
  and `getRelatedRecords` all send `READ` with only `APIData`, told apart by `RecordID` and
  `RelatedListAPIName`. The parent answers
  `{ type: 'FRAMEWORK.EVENT', eventName: 'EVENT_RESPONSE' | 'EVENT_RESPONSE_FAILURE', promiseid, data }`,
  and the SDK resolves or rejects the method's promise with `data` unchanged
- **In our code:** `resolveWidgetSdkCall` maps a message to a method name; mocks answer with the
  value the widget receives

## Listeners registered after `init()` never fire

- **Observed:** 2026-11-24, SDK 1.5 source
- **Spec says:** the docs advise calling `on()` before `init()`
- **Actually:** `init()` attaches the listeners collected so far, once; `on()` afterwards only
  stores a handler that is never attached
- **In our code:** the emulator sends `PageLoad` right after `SET_CONTEXT`; the widget skill states
  the rule
