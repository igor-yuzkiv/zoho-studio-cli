# `zoho-studio z-crm:functions:import`

Копіює функцію, вже завантажену в `data/zoho-crm/functions/`, у `src/zoho-crm/functions/`, щоб одразу
почати працювати над наявною функцією. Нічого не питає, працює без термінала й без входу і нічого не
надсилає в Zoho.

```bash
zoho-studio z-crm:functions:import oz_wf_refresh_pricing
```

```text
Created src/zoho-crm/functions/oz_wf_refresh_pricing/oz_wf_refresh_pricing.deluge
Created src/zoho-crm/functions/oz_wf_refresh_pricing/oz_wf_refresh_pricing.deploy.json
```

`<api_name>` — папка функції в `data/zoho-crm/functions/`, тобто її API-ім'я. Без нього функцію можна
вибрати зі списку завантажених функцій, яких ще немає в `src/`: наберіть кілька літер, щоб звузити
список за API-ім'ям чи display name. Без термінала список просто друкується, і нічого не імпортується.
Той самий імпорт
пропонує [`zoho-studio z-crm:functions:make`](29-functions-make-command.md), коли введене там API-ім'я
має snapshot.

## Що записується

Код snapshot-а копіюється без змін у `<api_name>.deluge`, а `<api_name>.deploy.json` записується з
метаданих snapshot-а — з CRM `id` функції, тож перший
[`z-crm:functions:deploy`](30-functions-deploy-command.md) оновить цю функцію, а не створить іншу:

```json
{
    "id": "6640142000053695173",
    "name": "Refresh Pricing",
    "api_name": "oz_wf_refresh_pricing",
    "description": "Recalculates",
    "runtime": "Deluge 1.0",
    "category": "Automation",
    "deployments": []
}
```

Snapshot у `data/` лишається як є. Якщо код не оголошує `<category>.<display name>` так, як очікує
Zoho, файли все одно записуються, а команда друкує попередження, що deploy буде відхилено, доки
оголошення не виправлено.

## Коли команда відмовляє

Нічого не записується, а команда завершується з кодом 1, коли:

- snapshot-а функції немає в `data/` — спершу завантажте функції;
- у `src/zoho-crm/functions/` функція вже є, з тим самим API-ім'ям у будь-якому регістрі;
- функція не на `Deluge 1.0` або її категорія не одна із семи категорій Deluge;
- у snapshot-і немає коду або в ньому більше одного запису функції — завантажте функції знову;
- `src/zoho-crm/functions/` досі тримає завантажені функції з часів до переїзду в `data/` —
  перенесіть їх командою `mv src/zoho-crm data/zoho-crm`.
