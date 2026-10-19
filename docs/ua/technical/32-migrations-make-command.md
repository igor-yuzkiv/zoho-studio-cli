# `zoho-studio z-crm:migrations:make`

Створює файл міграції в `migrations/zoho-crm/` за кількома запитаннями, тож ви починаєте з файлу,
де дія та модуль уже заповнені, і лише оголошуєте поля. Працює офлайн: без входу й без запитів до
Zoho.

```bash
zoho-studio z-crm:migrations:make
```

```text
✔ Migration type Create a module
✔ Module name (plural label) Customer Orders
✔ Singular label Customer Order

Migration to create:
  Name:   002-create-customer-orders
  File:   migrations/zoho-crm/002-create-customer-orders.ts
  Action: create the module "Customer Orders" (singular "Customer Order")
✔ Create the migration? Yes
Created migrations/zoho-crm/002-create-customer-orders.ts
Declare the fields, then check it with "bun run migrate 002-create-customer-orders --dry-run".
```

Команді потрібен інтерактивний термінал; без нього вона завершується з помилкою й нічого не створює.

## Запитання

- **Migration type** — `Create a module` або `Add fields to an existing module`, тобто дії `create`
  і `update` [міграції](27-migrations.md#файл-міграції).
- Для нового модуля: **Module name (plural label)** і **Singular label**. Мітку в однині
  запропоновано з множинної (`Projects` → `Project`, `Companies` → `Company`), її можна змінити.
  Кожна мітка має 1–50 символів.
- Для наявного модуля: **Module** — пошук серед модулів, завантажених у `data/zoho-crm/modules/`.
  Незавантажений модуль можна ввести за API-ім'ям і вибрати як `<name> (not pulled)`. Якщо нічого не
  завантажено, команда одразу питає API-ім'я. API-ім'я починається з літери й містить лише літери,
  цифри та одиночні підкреслення, не в кінці.

Перед записом команда показує назву міграції, її файл і що вона зробить, та просить підтвердження;
відмова нічого не створює.

## Файл

Назва складається з наступного номера після найбільшого номера міграції в папці, дії та модуля в
kebab case: `003-update-deals` іде після `002-create-customer-orders`. Номер має три цифри або
стільки, скільки вже використовує проєкт.

```ts
import { defineMigration } from '@zoho-studio/zoho-crm/migrations'

export default defineMigration({
    create: {
        singular_label: 'Customer Order',
        plural_label: 'Customer Orders',
        fields: (schema) => {
            // schema.text('Code', { length: 50 })
        },
    },
})
```

Міграція `update` замість міток називає модуль: `module: 'Deals'`. `api_name` нового модуля не
записано, тож Zoho виведе його з множинної мітки; додайте його у файл, щоб вибрати самостійно.

Поля оголошуєте ви — див. [типи полів](27-migrations.md#типи-полів). Доки міграція `update` не
оголошує жодного поля, `bun run migrate` показує це як конфлікт.
