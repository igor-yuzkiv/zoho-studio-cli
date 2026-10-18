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

**Спершу запустіть [`zoho-studio z-crm:modules:pull`](7-modules-pull-command.md) і запускайте цю команду
знову після кожного `z-crm:modules:pull`.** Список модулів береться з локальної папки модулів, а
`z-crm:modules:pull` видаляє й створює цю папку заново — разом із layouts.

Команді також потрібен проєкт, який пройшов [`zoho-studio login`](4-login-command.md), з наданим
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

**Папка `layouts/` кожного завантаженого модуля видаляється й створюється заново під час кожного
запуску**, тож layout, видалений у Zoho, зникає й локально, а будь-яка локальна правка в ній
втрачається. Метадані модуля і його папку `fields/` команда не чіпає, а модуль, що не бере участі в
запуску, зберігає свої layouts.

## Один модуль за раз

```bash
zoho-studio z-crm:layouts:pull --module=Deals
```

Значення — API-назва модуля, тобто назва його локальної папки. Значення, що не є простою назвою
папки, або модуль без локальної папки зупиняють команду, перш ніж щось буде видалено.

## Збої

Модуль, layouts якого не вдалося отримати, не зупиняє запуск. Його наявна папка `layouts/`
лишається недоторканою, модуль потрапляє в підсумок з коротким описом помилки, а решта модулів
завантажується далі. Порожня або відсутня папка модулів — фатальна помилка, і повідомлення вказує
на `z-crm:modules:pull`.

Модулі запитуються по одному з короткою паузою між ними, щоб не впертися в ліміти API Zoho.

## Логи

`z-crm:layouts:pull` записує в [`logs.file`](2-settings.md) початок запуску, кількість знайдених
локальних модулів, підсумкові лічильники та кожен збій зі стеком викликів.
