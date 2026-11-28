# `zoho-studio z-crm:layouts:pull`

Завантажує layouts кожного локально збереженого модуля в його підпапку `layouts/` — по одному файлу
JSON на layout, із секціями та полями в кожній секції. Саме тут поля-формули мають свій вираз:
`z-crm:fields:pull` отримує тип результату формули, але не саму формулу, бо Zoho повертає вираз
лише у складі layout.

```bash
zoho-studio z-crm:layouts:pull
```

```text
Pulling layouts |████████████████████| 42/42 | Vendors
Modules processed: 42
Layouts saved: 47
Modules failed: 1
  - Ghost_Module: Request failed with status code 400
```

**Спершу запустіть [`zoho-studio z-crm:modules:pull`](modules.md).** Перелік модулів для обходу береться з локальної папки модулів, тож новий у Zoho модуль отримує layouts лише після того, як `z-crm:modules:pull` його збереже.

Команді також потрібен проєкт, який пройшов [`zoho-studio login`](../project/login.md), з наданим
дозволом `ZohoCRM.settings.layouts.READ` (або `ZohoCRM.settings.ALL`).

## Що з'являється на диску

```text
data/zoho-crm/modules/
└── Deals/
    ├── Deals.metadata.json
    ├── fields/
    └── layouts/
        ├── Standard__s.json
        └── Partner_Deals.json
```

Кожен файл названо за API-назвою layout, і він містить layout саме таким, яким його повернув
`GET /settings/layouts`, відформатований з відступом у чотири пробіли й завершальним переведенням
рядка. Якщо два layouts мають однакову API-назву, до імені файлу другого додається його id.

Layouts запитуються з `mode=all`, тож `sections` містить і секції швидкого створення та візитки
поруч із тими, що показує сторінка запису. Поле-формула всередині секції виглядає так:

```json
{
    "api_name": "Total",
    "data_type": "formula",
    "formula": {
        "return_type": "double",
        "expression": "${Quantity}*2",
        "evaluation_order": 1,
        "dynamic": false,
        "stop_compute_conditionally": false,
        "assume_default": true,
        "stop_compute_expression": null
    }
}
```

**Папка `layouts/` кожного завантаженого модуля віддзеркалює поточне завантаження.** Файл, вміст якого не змінився, лишається як є, змінений перезаписується, а layout, видалений в Zoho, переїжджає в `data/.removed/<дата-час>/` — див. [Завантаження](../../guides/pulling.md). Метадані модуля і його папку `fields/` команда не чіпає, а модуль, що не бере участі в запуску, зберігає свої layouts.

## Один модуль за раз

```bash
zoho-studio z-crm:layouts:pull --module=Deals
```

Значення — API-назва модуля, тобто назва його локальної папки. Значення, що не є простою назвою
папки, або модуль без локальної папки зупиняють команду, перш ніж щось буде записано чи перенесено.

## Збої

Модуль, layouts якого не вдалося отримати, не зупиняє запуск. Його наявна папка `layouts/`
лишається недоторканою, модуль потрапляє в підсумок з коротким описом помилки, а решта модулів
завантажується далі. Порожня або відсутня папка модулів — фатальна помилка, і повідомлення вказує
на `z-crm:modules:pull`.

Модулі запитуються по одному з короткою паузою між ними, щоб не впертися в ліміти API Zoho.

## Логи

`z-crm:layouts:pull` записує в [`logs.file`](../project/settings.md) початок запуску, кількість знайдених
локальних модулів, підсумкові лічильники та кожен збій зі стеком викликів.
