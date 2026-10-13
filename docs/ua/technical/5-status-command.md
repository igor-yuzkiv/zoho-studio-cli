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
  primary email: owner@acme.test
```

Якщо збережений токен доступу прострочено, його попутно оновлюють, тож успішний `z-crm:status`
означає ще й те, що refresh-токен досі працює. Про самі токени нічого не виводиться.

Команда потребує проєкту, який пройшов [`zoho-studio login`](4-login-command.md). Якщо запустити її
раніше, вона зупиниться з `This project is not authorized yet`.
