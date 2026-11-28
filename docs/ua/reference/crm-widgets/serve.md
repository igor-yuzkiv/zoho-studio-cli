# `zoho-studio z-crm:widgets:serve`

Запускає віджети Zoho CRM на вашому комп'ютері без Zoho. Віджет лишається зі справжнім Zoho JS SDK
v1.5 і працює за своєю адресою — `zet run`, Vite, будь-який статичний сервер; Zoho Studio грає роль
сторінки CRM навколо нього й відповідає SDK зі сценарію. У коді віджета нічого не змінюється.

**Віджет працює за `url` з його `widget.json`.** Zoho Studio не збирає й не віддає його. Якщо в `widget.json` є команда `run`, емулятор запускає нею віджет, коли відкривається перша сесія віджета; інакше запустіть віджет самі.

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
фікстуру Playwright (див. [e2e-тести](#e2e-тести)) і вкладку **Widgets** у [`browser`](../project/browser.md).

## Опції

- `-w, --widget <name>` — відкриває сесію для `widgets/<name>/` і друкує її адресу.
- `-s, --scenario <name>` — сценарій цієї сесії; без неї — `defaultScenario` з `widget.json`, а
  без нього — жодного сценарію (кожен виклик відхиляється).
- `-p, --port <number>` — порт, за замовчуванням `4610`. Емулятор слухає лише `127.0.0.1`.

## Папка віджета

```text
widgets/<name>/
  widget.json
  src/                       # код віджета, коли він лежить тут
  testing/
    scenarios/<scenario>.ts  # ситуація: PageLoad і які моки взяти
    mocks/<mocks>.ts         # відповіді методів SDK, спільні для сценаріїв і тестів
    tests/*.spec.ts
  results/<test>/            # пишуть e2e-тести
```

`widget.json`:

```json
{ "url": "http://127.0.0.1:5000/app/widget.html", "location": "Custom Button", "defaultScenario": "default", "run": { "command": "npm run dev" } }
```

- `url` — обов'язкова http(s)-адреса, за якою працює віджет. Її query і hash зберігаються.
- `location` — необов'язково, одне з `Dashboard`, `Web Tab`, `Custom Button`, `Custom Related List`,
  `Wizard`, `Signal`, `Settings`, `Blueprint`. Показується в `browser` і не змінює того, що отримує
  віджет.
- `defaultScenario` — необов'язково, сценарій сесії, коли його не названо.
- `source` — необов'язково, де лежить код віджета, відносно папки віджета або абсолютним шляхом, — для віджета, що лежить поза проєктом. Без нього — `src/` папки віджета, коли вона є. Zoho Studio не читає з нього коду; він підказує агенту, де шукати, і саме там стартує `run`.
- `run` — необов'язково, `{ "command": "<shell command>", "cwd": "<folder>" }`: як запустити віджет. `cwd` — відносно папки віджета або абсолютним шляхом; без нього — папка `source`, а без неї — папка віджета.

### Запуск віджета

З `run` перша сесія віджета перевіряє його `url`. Якщо щось відповідає, віджет не чіпають — запущений вами самими працює далі. Якщо нічого не відповідає, емулятор виконує команду й чекає до 60 секунд, поки `url` відповість; після цього відкривається сесія. Якщо команда завершилася раніше або не змусила `url` відповісти вчасно, сесія завершується помилкою з останніми 20 рядками виводу команди. Коли емулятор зупиняється — `Ctrl+C`, `SIGTERM` від Playwright, закриття `browser`, — він зупиняє кожен запущений ним віджет разом з усім, що запустила команда.

Таку папку створює [`z-crm:widgets:make`](make.md).

## Як емулюється CRM

SDK спілкується зі сторінкою CRM навколо себе через `postMessage` і довіряє лише батьківському
вікну, яке названо параметром `serviceOrigin` в адресі віджета. Сторінка емулятора відкриває віджет
в iframe з `serviceOrigin`, що вказує на неї саму, і далі:

1. на `REGISTER` від SDK відповідає `SET_CONTEXT`, після чого `ZOHO.embeddedApp.init()` завершується;
2. надсилає `PageLoad` з `pageLoad` сценарію точно так, як його записано;
3. відповідає на кожен виклик `ZOHO.CRM.*` — моком сценарію або помилкою — і
   пише його в журнал.

Якщо віджет не зареєструвався за 10 секунд, сторінка про це скаже: віджет не працює за своїм `url`,
не підключає SDK або не викликає `ZOHO.embeddedApp.init()`.

## Сценарії

Сценарій — це файл у `testing/scenarios/`, чий default export каже, що несе `PageLoad` і які моки відповідають SDK. Моки лежать у `testing/mocks/`, по файлу на набір відповідей, тож їх спільно використовують кілька сценаріїв і тестів:

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

`use` називає файли з `testing/mocks/` без `.ts`. Моки застосовуються в такому порядку, і пізніший замінює раніший з тим самим ключем: файли, які використовує сценарій, по порядку; власні `mocks` сценарію; файли, які використовує тест; `mocks` тесту. Якщо файлу з такою назвою немає, сесія завершується помилкою зі шляхом, за яким його шукали.

Ключ моку — ім'я методу SDK. Дані вирішують проміс віджета, а `{ $reject: value }` відхиляє його з
`value`; функція отримує аргументи виклику, і з тим, що вона повертає, відбувається те саме, а те, що
вона кидає, відхиляє проміс. `Error` надсилається як
`{ code: 'ZOHO_STUDIO_ERROR', message }`. Файли сценаріїв і моків імпортуються заново для кожної сесії, тож правка діє з наступної сесії без перезапуску.

Аргументи моку — це те, що надсилає SDK. Вони близькі до того, що передав віджет, але не завжди
такі самі: `getRecord` приходить як `{ APIData: { Entity, RecordID } }`, `updateRecord` — як
`{ type, Entity, APIData }`. Журнал викликів їх показує.

### Ключі моків

Ключ моку — це шлях методу в SDK без `ZOHO.CRM.`: `ZOHO.CRM.API.updateRecord` — це
`'API.updateRecord'`, `ZOHO.CRM.UI.Popup.closeReload` — `'UI.Popup.closeReload'`. Такий ключ має кожен
публічний метод SDK 1.5.

Сам SDK цієї назви не надсилає. Кожен виклик приходить на сторінку CRM як `postMessage` з
`category` і `type` або `action` — `updateRecord` шле `{ category: 'UPDATE', type: 'RECORD', Entity,
APIData }`, — і емулятор перетворює цю пару назад на назву методу. Таблицю складено з коду SDK 1.5,
тож для іншої версії SDK її може знадобитися оновити.

Два випадки визначаються за аргументами, а не за `category` і `type`:

- `getRecord`, `getAllRecords` і `getRelatedRecords` шлють однакове `{ category: 'READ', APIData }`.
  Виклик з `RecordID` і `RelatedList` (або `RelatedListAPIName`) — це `API.getRelatedRecords`, лише з
  `RecordID` — `API.getRecord`, без нього — `API.getAllRecords`.
- `insertRecord` і `upsertRecord` обидва шлють `category: 'CREATE'`; `upsertRecord` відрізняється за
  `APIData.action: 'UPSERT'`.

Журнал викликів показує, який ключ отримав кожен виклик.

Під скомпільованим `zoho-studio` файли сценаріїв і моків можуть імпортувати з `@zoho-studio/zoho-crm/widget` лише `defineWidgetScenario` і `defineWidgetMocks`: виконуваний файл не завантажує пакети з `node_modules` проєкту, тож ці дві функції надає сам.

## Без моку

Zoho Studio нічого не відповідає сам. Кожен метод, якого не мокає сценарій або тест, — записи,
метадані, `CONFIG.*`, `UI.*`, `HTTP.*`, `CONNECTION.invoke`, `CONNECTOR.*` — відхиляється з
`{ code: 'ZOHO_STUDIO_NO_MOCK', message }`, де повідомлення називає метод і файл сценарію, куди його додати.

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

- `open({ widget, scenario?, use?, mocks? })` — відкриває віджет у новій сесії; чекає, поки віджет зареєструється, а якщо ні — падає з повідомленням емулятора. `use` називає файли з `testing/mocks/`, а `mocks` — це відповіді прямо в тесті; і ті, й інші замінюють моки сценарію з тим самим ключем лише для цього тесту, тож для однієї зміненої відповіді окремий файл сценарію не потрібен. Вбудовані `mocks` — це дані: вони переходять з процесу тесту, тож мок з логікою кладуть у файл і називають у `use`:

  ```ts
  await widgetPage.open({
      widget: 'deal-card',
      use: ['empty-search'],
      mocks: { 'API.updateRecord': { $reject: { code: 'INVALID_DATA', message: 'invalid data' } } },
  })
  ```

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
    gracefulShutdown: { signal: 'SIGTERM', timeout: 5_000 },
},
```

Без `gracefulShutdown` Playwright вбиває емулятор через `SIGKILL`, і віджети, запущені через `run`, працюють далі.

Playwright виконує тести в Node, а не в Bun; фікстура написана саме під це.

## HTTP API

Ним користуються сторінка-обгортка й фікстура. Запит з `Origin`, відмінним від origin емулятора, —
наприклад, від самого віджета, — відхиляється з `403`.

| Метод і шлях | Що робить |
|---|---|
| `GET /api/widgets` | віджети з `widgets/` та їхні сценарії |
| `POST /api/sessions` | відкриває сесію: `{ "widget": "deal-card", "scenario": "saves", "use": ["empty-search"], "mocks": { … } }` → `{ id, widget, scenario, url }`; усе, крім `widget`, необов'язкове. З `run` у `widget.json` відповідає, щойно відповість віджет |
| `GET /api/sessions/:id` | сесія |
| `DELETE /api/sessions/:id` | закриває її |
| `GET /api/sessions/:id/calls` | журнал викликів: `[{ at, method, args, ok, response \| error }]` |
| `POST /api/sessions/:id/events` | надсилає подію: `{ "name": "Notify", "data": { … } }` |
| `GET /api/sessions/:id/stream` | server-sent events, які обгортка пересилає віджету |
| `POST /api/sessions/:id/sdk` | відповідає на одне повідомлення SDK; його викликає сторінка-обгортка |
| `GET /harness/:id` | сторінка, в якій відкрито віджет |
