# Міграції

Міграція створює у вашій CRM модуль із полями або додає поля до вже наявного модуля. Ви описуєте
її у файлі, Zoho Studio звіряє її з CRM і показує, що зробить, і лише після вашого підтвердження
щось надсилає.

**Міграція лише створює, і скасувати її засобами Zoho Studio неможливо.** Вона ніколи не змінює й
не видаляє поля, а Zoho не дає змоги видалити модуль через свій API. Спершу спробуйте міграцію на
організації sandbox.

Для міграцій у проєкті мають бути встановлені пакети — див. [Проєкт](4-project.md#скрипти-й-міграції).

## 1. Напишіть міграцію

Створіть файл у `migrations/zoho-crm/`. Його назва — це назва міграції, а число на початку
впорядковує міграції, наприклад `001-create-projects.ts`. У проєкті є приклад, який можна
скопіювати: `scripts/example-migration.ts.txt`.

Або доручіть створення файлу Zoho Studio: `zoho-studio z-crm:migrations:make` питає, створити модуль
чи додати поля до наявного, який саме модуль, показує, що буде створено, і записує наступний за
номером файл, де заповнено все, крім полів. Детальніше: [z-crm:migrations:make](../technical/32-migrations-make-command.md).

```ts
import { defineMigration } from '@zoho-studio/zoho-crm/migrations'

export default defineMigration({
    create: {
        api_name: 'Projects',
        singular_label: 'Project',
        plural_label: 'Projects',
        fields: (schema) => {
            schema.text('Code', { length: 50 })
            schema.currency('Budget', { decimal_place: 2 })
            schema.date('Deadline')
            schema.picklist('Stage', { values: ['New', 'Active', 'Done'] })
            schema.lookup('Account', { module: 'Accounts' })
        },
    },
})
```

Щоб додати поля до наявного модуля, використайте `update` замість `create`:

```ts
export default defineMigration({
    update: {
        module: 'Projects',
        fields: (schema) => {
            schema.boolean('Archived')
        },
    },
})
```

Типи полів: text, textarea, email, phone, website, integer, bigint, double, percent, currency,
date, datetime, boolean, picklist, multiselectpicklist, lookup, userlookup. Опції кожного типу
наведено в [довіднику з міграцій](../technical/27-migrations.md#типи-полів).

Будь-яке поле може мати підказку для того, хто його заповнює: `schema.text('Code', { tooltip: 'Internal project code' })`
показує поруч із полем іконку з цим текстом.

## 2. Перевірте її

```bash
bun run migrate 001-create-projects --dry-run
```

Команда показує план — модуль, а потім поля партіями — і всі **конфлікти**: уже зайняту назву
модуля чи поля, lookup на модуль, якого немає, невідомий профіль, помилку у файлі. Міграція з
конфліктом не запускається. Виправте файл і перевірте знову.

## 3. Запустіть її

```bash
bun run migrate
```

Виберіть міграцію зі списку, прочитайте план і підтвердьте. **Перевірте перший рядок**: у ньому
назва організації, куди піде міграція, і позначка `SANDBOX` зеленим або `PRODUCTION` червоним. Термінал показує кожен крок і кожне
поле в міру створення. Наприкінці Zoho Studio знову зчитує модуль із CRM, повідомляє, які поля
існують, і оновлює файли модуля в `data/zoho-crm/modules/`.

## Після запуску

Кожен запуск запам'ятовується для організації в `.zoho-studio/migrations.json`. Застосована
міграція позначається як застосована й не може запуститися знову на тій самій організації.
Невдалу можна запустити ще раз, але все, що вона вже створила, тоді вважається конфліктом —
завершіть роботу новою міграцією `update`.

Ця історія залишається на вашому комп'ютері: запусків ваших колег у ній немає.

Докладніше: [довідник з міграцій](../technical/27-migrations.md).
