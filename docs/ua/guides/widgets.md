# Віджети

Zoho Studio запускає ваші віджети Zoho CRM на вашому комп'ютері без Zoho: ви відкриваєте віджет, він
отримує запис і відповіді на свої виклики SDK, і ви бачите, що він робить, — вручну або в
автоматичних тестах зі скріншотами. Віджет ви пишете як звикли; в його коді нічого не змінюється.

**Віджет працює за своєю адресою** — через `zet run`, dev-сервер або будь-який статичний сервер. Zoho Studio відкриває його там і грає роль Zoho CRM навколо нього. Дайте йому команду, що запускає віджет, і Zoho Studio запустить його, коли треба.

## Додати віджет

```bash
zoho-studio z-crm:widgets:make --name=deal-card --url=http://127.0.0.1:5000/app/widget.html --module=Deals --run="npm run dev"
```

Команда створює `widgets/deal-card/`, де лежать:

- `widget.json` — де працює віджет, де лежить його код і як його запустити;
- `testing/scenarios/default.ts` — на якому записі відкривається віджет;
- `testing/mocks/record.ts` — як Zoho відповідає на читання цього запису;
- `testing/tests/deal-card.spec.ts` — автоматичний тест.

Покладіть код віджета в `widgets/deal-card/src/`: команда запуску стартує там. Віджет, що лежить деінде — в іншому репозиторії, у спільній папці, — лишається на своєму місці: натомість передайте `--source=<шлях до його папки>`.

Zoho Studio нічого не відповідає сам: кожен виклик SDK віджета — читання запису, його полів,
організації, навіть `UI.Resize` — потребує відповіді в сценарії.

## Подивитися на нього

```bash
zoho-studio browser
```

Відкрийте **Widgets**, виберіть віджет і сценарій, натисніть **Open**. Панель праворуч показує
кожен виклик віджета до Zoho і що він отримав у відповідь; червона крапка — виклик, що завершився
помилкою. Внизу панелі можна надіслати віджету подію (`Notify`, `ContextUpdate`, …).

`zoho-studio z-crm:widgets:serve --widget=deal-card` робить те саме без застосунку: друкує адресу,
яку треба відкрити.

## Описати ситуації сценаріями

Сценарій — це одна ситуація: запис, користувач, помилка. Відповіді Zoho лежать окремо, у `testing/mocks/`, за іменами методів SDK, тож їх спільно використовують кілька сценаріїв і тестів:

```ts
// testing/mocks/saving.ts
import { defineWidgetMocks } from '@zoho-studio/zoho-crm/widget'

export default defineWidgetMocks({
    'API.updateRecord': ({ APIData }) => ({ data: [{ code: 'SUCCESS', details: { id: APIData.id } }] }),
})
```

Сценарій у `testing/scenarios/` називає запис і моки, які він використовує:

```ts
// testing/scenarios/saves.ts
import { defineWidgetScenario } from '@zoho-studio/zoho-crm/widget'

export default defineWidgetScenario({
    pageLoad: { Entity: 'Deals', EntityId: '1000000000001' },
    use: ['record', 'saving'],
})
```

Тест може змінити відповідь лише для себе, без нового сценарію: `widgetPage.open({ widget: 'deal-card', use: ['empty-search'] })` або `mocks: { 'API.searchRecord': { data: [] } }`; відповідь `{ $reject: { … } }` змушує виклик завершитися помилкою, як помилка від Zoho.

Коли віджет викликає те, на що сценарій не відповідає, віджет отримує помилку з назвою методу й місцем, куди його додати. Деякі можливості SDK —
функції Deluge (`FUNCTIONS.execute`), Blueprint, Wizard, ZRC — відповідають помилкою, що Zoho Studio
їх не виконує.

## Протестувати

Один раз додайте Playwright у проєкт:

```bash
bun add -d @playwright/test
bunx playwright install chromium
```

Далі:

```bash
bunx playwright test
```

`playwright.config.ts` сам запускає емулятор Zoho Studio, а емулятор запускає віджет його командою запуску; без неї спершу запустіть віджет. Кожен тест лишає свої скріншоти й список
викликів SDK (`calls.json`) у `widgets/<name>/results/<test>/`; HTML-звіт — у `widgets/.report/`.
Не додавайте їх у git — нові проєкти вже їх ігнорують.

## Для AI-агентів

Скіл `widget-testing` [плагіна Claude Code](claude-code-plugin.md) навчає агента писати сценарії й тести та звітувати результати зі скріншотами: попросіть агента протестувати віджет або запустіть `/zoho-studio:widget-testing`. Проєкт, створений старішим `zoho-studio init`, має власну копію цього скіла в `.claude/skills/zoho-crm-widget-testing/`; вона вже не відповідає CLI, тож видаліть цю папку. У проєкт, створений до появи тестування віджетів, додайте в `.gitignore`:

```text
widgets/*/results/
widgets/.report/
test-results/
```

а в `include` файлу `tsconfig.json` — `"widgets/**/*.ts", "playwright.config.ts"`.

Докладніше: [`z-crm:widgets:serve`](../reference/crm-widgets/serve.md),
[`z-crm:widgets:make`](../reference/crm-widgets/make.md).
