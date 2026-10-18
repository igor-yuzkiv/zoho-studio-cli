# `zoho-studio z-crm:functions:make`

Створює нову Deluge-функцію в `src/zoho-crm/functions/` за кількома запитаннями, щоб ви починали з
файлів, які Zoho прийме, а не з порожньої сторінки. Працює офлайн: без входу й без запитів до Zoho.

```bash
zoho-studio z-crm:functions:make
```

```text
✔ Category Automation
✔ Return type void
✔ Module Programs
✔ What the function does refresh pricing
✔ API name oz_wf_programs_refresh_pricing
✔ Display name oz_wf_programs_refresh_pricing
✔ Description Recalculates the program prices

Files to create:
  src/zoho-crm/functions/oz_wf_programs_refresh_pricing/oz_wf_programs_refresh_pricing.deluge
  src/zoho-crm/functions/oz_wf_programs_refresh_pricing/oz_wf_programs_refresh_pricing.deploy.json
✔ Create the function? Yes
Created src/zoho-crm/functions/oz_wf_programs_refresh_pricing/oz_wf_programs_refresh_pricing.deluge
Created src/zoho-crm/functions/oz_wf_programs_refresh_pricing/oz_wf_programs_refresh_pricing.deploy.json
```

Команді потрібен інтерактивний термінал; без нього вона зупиняється з помилкою й нічого не створює.

## Запитання

- **Category** — одна із семи категорій Deluge: Button, Automation, Schedule, Related List,
  Standalone, Signals, Validation Rule.
- **Return type** — лише для Automation (`void` або `string`). Кожна інша категорія дозволяє один
  тип, і він підставляється сам: `string` для Button, Related List і Standalone, `void` для Schedule
  і Signals, `map` для Validation Rule.
- **Module** і **What the function does** — частини запропонованого API-імені, їх питають, лише коли
  naming увімкнено. Модуль вибирається з модулів, завантажених у `data/zoho-crm/modules/`, вводиться
  вручну або пропускається. Обидва значення перетворюються на lower snake case.
- **API name** — пропонується за [`zohoCrm.functions.naming`](2-settings.md) як
  `<vendor>_<префікс категорії>_<модуль>_<призначення>`, і його можна змінити. Коли naming вимкнено,
  ви вводите його самі.
- **Display name** — API-ім'я, якщо ви його не зміните.
- **Description** — необов'язковий.

Відповіді перевіряються за правилами Zoho під час введення: display name має 3–100 символів,
починається з літери й містить літери, цифри, пробіли, `-` і `_`; API-ім'я — те саме, але без
пробілів; опис — до 3000 символів. API-ім'я, папка якого вже є в `src/zoho-crm/functions/`,
відхиляється.

Перед записом команда показує файли, які створить, і просить підтвердження; відмова нічого не створює.

## Що з'являється на диску

```text
src/zoho-crm/functions/
└── oz_wf_programs_refresh_pricing/
    ├── oz_wf_programs_refresh_pricing.deluge
    └── oz_wf_programs_refresh_pricing.deploy.json
```

І папка, і файли названі за API-ім'ям, яке Zoho ніколи не дозволяє змінити.

`*.deluge` містить заготовку, яка компілюється як є. Zoho вимагає, щоб оголошення складалося з
категорії та display name, обидва в нижньому регістрі, з `_` замість пробілів і `-`, тож заготовка
пише його за вас; тіло повертає порожнє значення оголошеного типу:

```text
void automation.oz_wf_programs_refresh_pricing()
{
}
```

Аргументи команда не питає — додайте їх в оголошення самі.

`*.deploy.json` містить те, що Zoho потрібно, крім коду:

```json
{
    "id": null,
    "name": "oz_wf_programs_refresh_pricing",
    "api_name": "oz_wf_programs_refresh_pricing",
    "description": "Recalculates the program prices",
    "runtime": "Deluge 1.0",
    "category": "Automation",
    "deployments": []
}
```

`id` лишається `null`, доки функції немає в Zoho. Тип повернення й аргументи тут не повторюються:
Zoho читає їх з оголошення.

## Проєкт, який досі тримає snapshot-и в `src/`

Завантажені snapshot-и раніше лежали в `src/zoho-crm/`. Якщо в `src/zoho-crm/functions/` є папка з файлами, але без
`*.deploy.json`, команда зупиняється ще до запитань і підказує перенести snapshot-и командою
`mv src/zoho-crm data/zoho-crm`.
