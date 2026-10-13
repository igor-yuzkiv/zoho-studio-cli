# `zoho-studio z-crm:org:info`

Зчитує організацію, до якої підключено проєкт, виводить поля, які варто бачити в терміналі,
і зберігає повний запис у `.zoho-studio/org.json`.

```bash
zoho-studio z-crm:org:info          # the readable card, plus the stored file
zoho-studio z-crm:org:info --json   # the org record exactly as Zoho returned it
```

```text
Organization: Acme Inc
  id: 7000000012345
  type: sandbox
  domain: acme
  primary email: owner@acme.test
  location: Statesville, NC, US
  currency: US Dollar - USD
  time zone: EST
  created: 2025-07-22T10:28:51+03:00
  licence: zohooneenterprise, 20 users

Saved to /projects/acme/.zoho-studio/org.json
```

Поле, яке Zoho залишив порожнім, не потрапляє в картку; збережений файл завжди містить запис цілком,
тому це два різні подання. Файл перезаписується під час кожного успішного запуску й
не зачіпається, коли запит не вдається, тож невдалий запуск зберігає попередній знімок.

Знімок лежить поруч із `settings.json`, а не в `src/`, бо описує підключення проєкту,
а не ресурс, завантажений із Zoho. `.gitignore`, який [`init`](3-init-command.md) кладе в
`.zoho-studio/`, не пускає його в git — це локальний знімок, який заново створює будь-який запуск команди.

[`zoho-studio login`](4-login-command.md) виконує те саме завантаження, щойно токени збережено, тож новий
проєкт має цей файл без другої команди. Збій там лише повідомляється — сам вхід
усе одно вдається.

`z-crm:org:info` потребує проєкту, який пройшов `zoho-studio login`. Якщо
[`z-crm:status`](5-status-command.md) — коротка перевірка з'єднання, то `z-crm:org:info` — повний запис і
файл, що до нього додається.
