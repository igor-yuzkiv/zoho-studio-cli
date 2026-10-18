# `zoho-studio z-crm:functions:make`

Створює нову Deluge-функцію в `src/zoho-crm/functions/` за кількома запитаннями, щоб ви починали з
файлів, які Zoho прийме, а не з порожньої сторінки, або імпортує функцію, вже завантажену в `data/`. Працює офлайн: без входу й без запитів до Zoho.

```bash
zoho-studio z-crm:functions:make
```

```text
✔ Category Standalone
✔ Is the function tied to a module? No
✔ What the function does testZohoStudioMakeFunction
✔ API name sa_test_zoho_studio_make_function
✔ Display name sa_test_zoho_studio_make_function
✔ Description

Files to create:
  src/zoho-crm/functions/sa_test_zoho_studio_make_function/sa_test_zoho_studio_make_function.deluge
  src/zoho-crm/functions/sa_test_zoho_studio_make_function/sa_test_zoho_studio_make_function.deploy.json
✔ Create the function? Yes
Created src/zoho-crm/functions/sa_test_zoho_studio_make_function/sa_test_zoho_studio_make_function.deluge
Created src/zoho-crm/functions/sa_test_zoho_studio_make_function/sa_test_zoho_studio_make_function.deploy.json
```

Команді потрібен інтерактивний термінал; без нього вона зупиняється з помилкою й нічого не створює.

## Запитання

- **Category** — одна із семи категорій Deluge: Button, Automation, Schedule, Related List,
  Standalone, Signals, Validation Rule.
- **Return type** — лише для Automation (`void` або `string`). Кожна інша категорія дозволяє один
  тип, і він підставляється сам: `string` для Button, Related List і Standalone, `void` для Schedule
  і Signals, `map` для Validation Rule.
- **Is the function tied to a module?**, **Module** і **What the function does** — частини
  запропонованого API-імені, їх питають, лише коли naming увімкнено. Відповідь «ні» на перше прибирає
  сегмент модуля; «так» пропонує модулі, завантажені в `data/zoho-crm/modules/`, або сегмент, введений
  вручну (лише його, коли нічого не завантажено). Обидві частини перетворюються на lower snake case, а camel case
  розбивається на слова: `refreshPricing` стає `refresh_pricing`.
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

## Імпорт завантаженої функції

Коли введене API-ім'я належить функції, вже завантаженій у `data/zoho-crm/functions/`, команда
пропонує імпортувати її в `src/` замість створення нової. Відмова нічого не створює.
Щоб імпортувати відому функцію без запитань, скористайтеся
[`zoho-studio z-crm:functions:import`](31-functions-import-command.md).

Імпорт копіює код snapshot-а без змін у `<api_name>.deluge` і записує `<api_name>.deploy.json` з
метаданих snapshot-а — разом з її CRM `id`, тож deploy оновить цю функцію, а не створить іншу.
Snapshot у `data/` лишається як є. Категорія береться
зі snapshot-а, хоч би що ви вибрали в першому запитанні.

Імпортувати можна лише функцію на `Deluge 1.0` з однією із семи категорій Deluge; будь-яку іншу
команда відхиляє й пояснює чому. Якщо код не оголошує `<category>.<display name>` так, як очікує Zoho,
імпорт усе одно відбувається, а команда попереджає, що deploy буде відхилено, доки оголошення не
виправлено.

## Проєкт, який досі тримає snapshot-и в `src/`

Завантажені snapshot-и раніше лежали в `src/zoho-crm/`. Якщо в `src/zoho-crm/functions/` є папка з файлами, але без
`*.deploy.json`, команда зупиняється ще до запитань і підказує перенести snapshot-и командою
`mv src/zoho-crm data/zoho-crm`.
