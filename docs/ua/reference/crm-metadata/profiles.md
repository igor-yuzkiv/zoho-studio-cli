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

Команді потрібен проєкт, у якому виконано [`zoho-studio login`](../project/login.md) і надано
дозвіл `ZohoCRM.settings.profiles.READ` (або `ZohoCRM.settings.ALL`, що його охоплює).
Без нього Zoho відповідає `OAUTH_SCOPE_MISMATCH`; цей дозвіл є в типових
[налаштуваннях](../project/settings.md), тож проєкт, створений до його появи, має додати його до `auth.scopes`
і ввійти знову.

Команда входить до типового [пресета](../project/preset.md) `pull-crm`.

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

Папка віддзеркалює відповідь Zoho: файл, вміст якого не змінився, лишається як є, змінений перезаписується, а профілі, видалені в Zoho, переїжджають у `data/.removed/<дата-час>/` — див. [Завантаження](../../guides/pulling.md). Нічого не переноситься, доки запит переліку не вдався, тож невдалий запуск залишає попередній знімок на місці.