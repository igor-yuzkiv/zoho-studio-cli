# `zoho-studio z-crm:global-picklists:pull`

Завантажує всі глобальні списки вибору Zoho CRM у плоску папку `src/zoho-crm/global-picklists/` — по одному
файлу JSON на список, разом із `pick_list_values`, яких немає в самому переліку списків.

```bash
zoho-studio z-crm:global-picklists:pull
```

```text
Pulling global picklists |████████████████████| 14/14 | Source
Global picklists found: 14
Global picklists saved: 14
Global picklists failed: 0
```

Команді потрібен проєкт, у якому виконано [`zoho-studio login`](4-login-command.md) і надано
дозвіл `ZohoCRM.settings.global_picklist.READ`. Без нього Zoho відповідає
`OAUTH_SCOPE_MISMATCH`; цей дозвіл є в типових [налаштуваннях](2-settings.md), тож проєкт, створений
до його появи, має додати його до `auth.scopes` і ввійти знову.

## Що ви отримуєте

```text
src/zoho-crm/global-picklists/
  Industry.json
  Source.json
  Time_Zone.json
```

Кожен файл — це один список вибору точно в тому вигляді, в якому Zoho повернула його з `settings/global_picklists/{id}`, —
метадані та всі значення з їхніми `actual_value`, `display_value` і `sequence_number`. Файли
називаються за `api_name`; список, чия назва не дає придатного імені файлу, зберігається під своїм id.

Папка очищується й записується заново під час кожного запуску, тож вона відображає відповідь Zoho, а не
накопичує списки, які відтоді видалено. Очищується вона лише після успішного запиту переліку —
невдалий запуск залишає попередній знімок на місці.

## Коли не вдається один список

Перелік отримується один раз, потім кожен список вибору запитується окремо, з короткою паузою між
запитами. Список, який не вдалося отримати, наприкінці називається на ім'я, а запуск триває:

```text
Global picklists saved: 13
Global picklists failed: 1
  - Time_Zone: permission denied (OAUTH_SCOPE_MISMATCH)
```

Збій самого запиту переліку зупиняє команду, бо перебирати немає чого,
а нічого ще не видалено.

Які поля використовують глобальний список вибору, ця команда не показує — цей ендпоінт зв'язків потребує
дозволу, якого Zoho тут не надала. Що містять поля кожного модуля, дає
[`z-crm:fields:pull`](8-fields-pull-command.md).
