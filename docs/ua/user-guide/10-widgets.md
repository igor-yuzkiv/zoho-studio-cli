# Віджети

Zoho Studio запускає ваші віджети Zoho CRM на вашому комп'ютері без Zoho: ви відкриваєте віджет, він
отримує запис і відповіді на свої виклики SDK, і ви бачите, що він робить, — вручну або в
автоматичних тестах зі скріншотами. Віджет ви пишете як звикли; в його коді нічого не змінюється.

**Віджет має бути запущений** — через `zet run`, dev-сервер або будь-який статичний сервер. Zoho
Studio відкриває його за цією адресою і грає роль Zoho CRM навколо нього.

## Додати віджет

```bash
zoho-studio z-crm:widgets:make --name=deal-card --url=http://127.0.0.1:5000/app/widget.html --module=Deals
```

Команда створює `widgets/deal-card/`, де лежать:

- `widget.json` — де працює віджет;
- `scenarios/default.ts` — на якому записі відкривається віджет і як відповідає Zoho;
- `fixtures/Deals.json` — записи, які він може читати;
- `tests/deal-card.spec.ts` — автоматичний тест.

Якщо віджет читає поля, layouts чи модулі, спершу стягніть їх — `z-crm:fields:pull --module=Deals`
тощо. На ці виклики Zoho Studio відповідає зі стягнутих файлів.

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

Коли віджет викликає те, на що сценарій не відповідає і для чого в Zoho Studio немає стандартної
відповіді, віджет отримує помилку з назвою методу й місцем, куди його додати. Деякі можливості SDK —
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
сценарії, фікстури й тести та звітувати результати зі скріншотами. У проєкт, створений раніше,
скопіюйте цю папку з нового проєкту, створеного `zoho-studio init`, і додайте в `.gitignore`:

```text
widgets/*/results/
widgets/.report/
test-results/
```

а в `include` файлу `tsconfig.json` — `"widgets/**/*.ts", "playwright.config.ts"`.

Докладніше: [`z-crm:widgets:serve`](../technical/34-widgets-serve-command.md),
[`z-crm:widgets:make`](../technical/35-widgets-make-command.md).
