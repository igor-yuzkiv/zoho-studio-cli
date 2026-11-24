# `zoho-studio z-crm:widgets:serve`

Запускає віджети Zoho CRM на вашому комп'ютері без Zoho. Віджет лишається зі справжнім Zoho JS SDK
v1.5 і працює за своєю адресою — `zet run`, Vite, будь-який статичний сервер; Zoho Studio грає роль
сторінки CRM навколо нього й відповідає SDK зі сценарію, зі стягнутих у `data/` метаданих і з
фікстур. У коді віджета нічого не змінюється.

**Віджет має вже працювати за `url` з його `widget.json`.** Zoho Studio не збирає й не віддає
віджет, а лише відкриває його.

```bash
zoho-studio z-crm:widgets:serve                                    # емулятор на порту 4610
zoho-studio z-crm:widgets:serve --widget=deal-card                 # ще й відкрити сесію та надрукувати її адресу
zoho-studio z-crm:widgets:serve -w deal-card -s saves -p 4700
```

```text
Widget emulator: http://127.0.0.1:4610
Open deal-card (saves): http://127.0.0.1:4610/harness/789e325b-1ed0-4646-b883-811c58d75a82
Press Ctrl+C to stop.
```

Відкрийте надруковану адресу в браузері, щоб побачити віджет. Той самий емулятор обслуговує
фікстуру Playwright (див. [e2e-тести](#e2e-тести)) і вкладку **Widgets** у [`browser`](25-browser-command.md).

## Опції

- `-w, --widget <name>` — відкриває сесію для `widgets/<name>/` і друкує її адресу.
- `-s, --scenario <name>` — сценарій цієї сесії; без неї — `defaultScenario` з `widget.json`, а
  без нього — жодного сценарію (лише стандартні відповіді).
- `-p, --port <number>` — порт, за замовчуванням `4610`. Емулятор слухає лише `127.0.0.1`.

## Папка віджета

```text
widgets/<name>/
  widget.json
  scenarios/<scenario>.ts
  fixtures/<Module>.json
  tests/*.spec.ts
  results/<test>/            # пишуть e2e-тести
```

`widget.json`:

```json
{ "url": "http://127.0.0.1:5000/app/widget.html", "location": "Custom Button", "defaultScenario": "default" }
```

- `url` — обов'язкова http(s)-адреса, за якою працює віджет. Її query і hash зберігаються.
- `location` — необов'язково, одне з `Dashboard`, `Web Tab`, `Custom Button`, `Custom Related List`,
  `Wizard`, `Signal`, `Settings`, `Blueprint`. Показується в `browser` і не змінює того, що отримує
  віджет.
- `defaultScenario` — необов'язково, сценарій сесії, коли його не названо.

Таку папку створює [`z-crm:widgets:make`](35-widgets-make-command.md).

## Як емулюється CRM

SDK спілкується зі сторінкою CRM навколо себе через `postMessage` і довіряє лише батьківському
вікну, яке названо параметром `serviceOrigin` в адресі віджета. Сторінка емулятора відкриває віджет
в iframe з `serviceOrigin`, що вказує на неї саму, і далі:

1. на `REGISTER` від SDK відповідає `SET_CONTEXT`, після чого `ZOHO.embeddedApp.init()` завершується;
2. надсилає `PageLoad` з `pageLoad` сценарію точно так, як його записано;
3. відповідає на кожен виклик `ZOHO.CRM.*` — моком сценарію, стандартною відповіддю або помилкою — і
   пише його в журнал.

Якщо віджет не зареєструвався за 10 секунд, сторінка про це скаже: віджет не працює за своїм `url`,
не підключає SDK або не викликає `ZOHO.embeddedApp.init()`.

## Сценарії

Сценарій — це TypeScript-файл, чий default export каже, що несе `PageLoad` і як відповідають методи SDK:

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

Ключ моку — ім'я методу SDK. Дані вирішують проміс віджета; функція отримує аргументи виклику, і те,
що вона повертає, вирішує проміс, а те, що кидає, — відхиляє. `Error` надсилається як
`{ code: 'ZOHO_STUDIO_ERROR', message }`. Файл імпортується заново для кожної сесії, тож правка діє з
наступної сесії без перезапуску.

Аргументи моку — це те, що надсилає SDK. Вони близькі до того, що передав віджет, але не завжди
такі самі: `getRecord` приходить як `{ APIData: { Entity, RecordID } }`, `updateRecord` — як
`{ type, Entity, APIData }`. Журнал викликів їх показує.

Під скомпільованим `zoho-studio` сценарій може імпортувати з `@zoho-studio/zoho-crm/widget` лише
`defineWidgetScenario`: виконуваний файл не завантажує пакети з `node_modules` проєкту, тож цю одну
функцію надає сам.

## Відповіді без моку

| Метод | Відповідь |
|---|---|
| `META.getFields({ Entity })` | `{ fields }` з `data/zoho-crm/modules/<Entity>/fields/` |
| `META.getModules()` | `{ modules }`, усі стягнуті модулі |
| `META.getLayouts({ Entity, Id? })` | `{ layouts }` з `data/zoho-crm/modules/<Entity>/layouts/` |
| `CONFIG.getOrgInfo()` | `{ org: [...] }` з `.zoho-studio/org.json` |
| `API.getRecord({ Entity, RecordID })` | `{ data: [record] }` з `fixtures/<Entity>.json`; запису, якого там немає, відповідає помилка `ZOHO_STUDIO_NO_FIXTURE` |
| `API.getAllRecords({ Entity })` | `{ data, info }` з `fixtures/<Entity>.json` |
| `UI.*` | `true` |

Фікстура — масив записів у тій формі, яку повертає Zoho. Метадані, які читає віджет, треба спершу
стягнути (`z-crm:modules:pull`, `z-crm:fields:pull`, `z-crm:layouts:pull`); на відсутній pull
відповідь — помилка з командою, яку треба запустити.

Будь-який інший метод без моку — зокрема `HTTP.*`, `CONNECTION.invoke` і `CONNECTOR.*` — відхиляється
з `{ code: 'ZOHO_STUDIO_NO_MOCK', message }`, де повідомлення називає метод і файл сценарію, куди
його додати.

Ці методи відхиляються з `ZOHO_STUDIO_UNSUPPORTED`, хоч би що казав сценарій: `FUNCTIONS.execute`,
`EVENTS.dispatch`, `WIZARD.post`, `BLUEPRINT.proceed`, `API.getBluePrint`, `API.updateBluePrint`,
методи погоджень, `API.uploadFile`, `API.getFile`, `ACTION.*`, `zrc.*` і `ZDK.Client.*`.

## Події

`PageLoad` надсилається один раз, коли віджет зареєструвався. Інші п'ять подій `embeddedApp` —
`Notify`, `NotifyAndWait`, `ContextUpdate`, `DialerActive`, `Dial` — надсилаються на вимогу: з
фікстури e2e (`widgetPage.emit`), з `browser` або через `POST /api/sessions/:id/events`.

## E2E-тести

`@zoho-studio/zoho-crm/widget-testing` додає фікстуру `widgetPage` до власного `test` Playwright у
проєкті. Сама вона Playwright не імпортує, тож у проєкті лишається одна його копія:

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

- `open({ widget, scenario? })` — відкриває віджет у новій сесії; чекає, поки віджет зареєструється,
  а якщо ні — падає з повідомленням емулятора.
- `frame` — сам віджет, `FrameLocator` Playwright.
- `calls()`, `waitForCall(method, { timeout? })` — журнал викликів сесії.
- `emit(name, data?)` — надсилає подію.
- `screenshot(name)` — зберігає `widgets/<widget>/results/<test>/<name>.png`.

Після кожного тесту фікстура пише в ту саму папку `calls.json` і `final.png` та закриває сесію. Кожен
тест має свою сесію, тож паралельні тести не бачать викликів одне одного.

Фікстура звертається до вже запущеного емулятора, за замовчуванням `http://127.0.0.1:4610`
(змінити — `createWidgetFixtures(base, { emulatorUrl })` або `ZOHO_STUDIO_WIDGETS_URL`). Playwright
запускає його через `webServer`, як у конфігу, який пише `z-crm:widgets:make`:

```ts
webServer: {
    command: 'zoho-studio z-crm:widgets:serve --port=4610',
    url: 'http://127.0.0.1:4610/api/widgets',
    reuseExistingServer: true,
},
```

Playwright виконує тести в Node, а не в Bun; фікстура написана саме під це.

## HTTP API

Ним користуються сторінка-обгортка й фікстура. Запит з `Origin`, відмінним від origin емулятора, —
наприклад, від самого віджета, — відхиляється з `403`.

| Метод і шлях | Що робить |
|---|---|
| `GET /api/widgets` | віджети з `widgets/` та їхні сценарії |
| `POST /api/sessions` | відкриває сесію: `{ "widget": "deal-card", "scenario": "saves" }` → `{ id, widget, scenario, url }` |
| `GET /api/sessions/:id` | сесія |
| `DELETE /api/sessions/:id` | закриває її |
| `GET /api/sessions/:id/calls` | журнал викликів: `[{ at, method, args, ok, response \| error }]` |
| `POST /api/sessions/:id/events` | надсилає подію: `{ "name": "Notify", "data": { … } }` |
| `GET /api/sessions/:id/stream` | server-sent events, які обгортка пересилає віджету |
| `POST /api/sessions/:id/sdk` | відповідає на одне повідомлення SDK; його викликає сторінка-обгортка |
| `GET /harness/:id` | сторінка, в якій відкрито віджет |
