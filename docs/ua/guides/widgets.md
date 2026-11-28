# Віджети

Zoho Studio запускає ваші віджети Zoho CRM на вашому комп'ютері без Zoho: ви відкриваєте віджет, він
отримує запис і відповіді на свої виклики SDK, і ви бачите, що він робить, — вручну або в
автоматичних тестах зі скріншотами. Віджет ви пишете як звикли; в його коді нічого не змінюється.

**Віджет має бути запущений** — через `zet run`, dev-сервер або будь-який статичний сервер. Zoho
Studio відкриває його за цією адресою і грає роль Zoho CRM навколо нього.

## Додати віджет

```bash
zoho-studio z-crm:widgets:make --name=deal-card --url=http://127.0.0.1:5000/app/widget.html --module=Deals --source=../deal-card-widget/app
```

Команда створює `widgets/deal-card/`, де лежать:

- `widget.json` — де працює віджет і де лежить його код;
- `scenarios/default.ts` — на якому записі відкривається віджет і як відповідає Zoho;
- `tests/deal-card.spec.ts` — автоматичний тест.

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

Сценарій — це одна ситуація: запис, відповідь Zoho, помилка. Напишіть по файлу на ситуацію в
`scenarios/` і перелічіть потрібні відповіді в `mocks` за іменами методів SDK:

```ts
import { defineWidgetScenario } from '@zoho-studio/zoho-crm/widget'

export default defineWidgetScenario({
    pageLoad: { Entity: 'Deals', EntityId: '1000000000001' },
    mocks: {
        'API.updateRecord': ({ APIData }) => ({ data: [{ code: 'SUCCESS', details: { id: APIData.id } }] }),
    },
})
```

Тест може змінити відповідь лише для себе, без нового сценарію:
`widgetPage.open({ widget: 'deal-card', mocks: { 'API.searchRecord': { data: [] } } })`;
відповідь `{ $reject: { … } }` змушує виклик завершитися помилкою, як помилка від Zoho.

Коли віджет викликає те, на що сценарій не відповідає, віджет отримує помилку з назвою методу й місцем, куди його додати. Деякі можливості SDK —
функції Deluge (`FUNCTIONS.execute`), Blueprint, Wizard, ZRC — відповідають помилкою, що Zoho Studio
їх не виконує.

## Протестувати

Один раз додайте Playwright у проєкт:

```bash
bun add -d @playwright/test
bunx playwright install chromium
```

Далі, коли віджет запущено:

```bash
bunx playwright test
```

`playwright.config.ts` сам запускає емулятор Zoho Studio. Кожен тест лишає свої скріншоти й список
викликів SDK (`calls.json`) у `widgets/<name>/results/<test>/`; HTML-звіт — у `widgets/.report/`.
Не додавайте їх у git — нові проєкти вже їх ігнорують.

## Для AI-агентів

Нові проєкти отримують скіл у `.claude/skills/zoho-crm-widget-testing/`, який навчає агента писати
сценарії й тести та звітувати результати зі скріншотами. У проєкт, створений раніше,
скопіюйте цю папку з нового проєкту, створеного `zoho-studio init`, і додайте в `.gitignore`:

```text
widgets/*/results/
widgets/.report/
test-results/
```

а в `include` файлу `tsconfig.json` — `"widgets/**/*.ts", "playwright.config.ts"`.

Докладніше: [`z-crm:widgets:serve`](../reference/crm-widgets/serve.md),
[`z-crm:widgets:make`](../reference/crm-widgets/make.md).
