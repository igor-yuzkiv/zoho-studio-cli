# `zoho-studio z-crm:status`

Запитує в Zoho, до якої організації підключено проєкт. Це найшвидший спосіб переконатися, що
профіль, збережені токени та `api.baseUrl` працюють разом.

```bash
zoho-studio z-crm:status          # the fields you usually want
zoho-studio z-crm:status --json   # the org record exactly as Zoho returned it
```

```text
Organization: Acme Inc
  id: 7000000012345
  type: sandbox
  domain: acme
  data center: com (https://www.zohoapis.com)
  primary email: owner@acme.test
```

`type` відрізняє sandbox (`sandbox`) від робочої організації. `domain` — частина вебадреси CRM, що належить організації: для sandbox у дата-центрі EU — `crmsandbox.zoho.eu/crm/<domain>/`. Запис організації не називає дата-центру, тож `data center` береться з `api.baseUrl` у [налаштуваннях](../project/settings.md): частина після `zohoapis.`, а потім сама адреса.

Якщо збережений токен доступу прострочено, його попутно оновлюють, тож успішний `z-crm:status`
означає ще й те, що refresh-токен досі працює. Про самі токени нічого не виводиться.

Команда потребує проєкту, який пройшов [`zoho-studio login`](../project/login.md). Якщо запустити її
раніше, вона зупиниться з `This project is not authorized yet`.
