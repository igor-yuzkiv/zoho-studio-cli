# `zoho-studio z-crm:profiles:pull`

Завантажує всі профілі Zoho CRM у плоску папку `data/zoho-crm/profiles/` — по одному файлу JSON на
профіль.

```bash
zoho-studio z-crm:profiles:pull
```

```text
Pulling profiles |████████████████████| 3/3 | Team_User
Profiles saved: 3
```

Команді потрібен проєкт, у якому виконано [`zoho-studio login`](4-login-command.md) і надано
дозвіл `ZohoCRM.settings.profiles.READ` (або `ZohoCRM.settings.ALL`, що його охоплює).
Без нього Zoho відповідає `OAUTH_SCOPE_MISMATCH`; цей дозвіл є в типових
[налаштуваннях](2-settings.md), тож проєкт, створений до його появи, має додати його до `auth.scopes`
і ввійти знову.

Команда входить до типового [пресета](24-preset-command.md) `pull-crm`.

## Що ви отримуєте

```text
data/zoho-crm/profiles/
  Administrator.json
  Standard.json
  Team_User.json
```

Кожен файл — це один профіль точно в тому вигляді, в якому Zoho повернула його з `settings/profiles`, — його `id`, `name`,
`api_name`, `type` і дозволи, які містить перелік. Файли називаються за `api_name`;
профіль, чия назва не дає придатного імені файлу, зберігається під своїм id.

Папка очищується й записується заново під час кожного запуску, тож вона відображає відповідь Zoho, а не
накопичує профілі, які відтоді видалено. Очищується вона лише після успішного запиту переліку —
невдалий запуск залишає попередній знімок на місці.
