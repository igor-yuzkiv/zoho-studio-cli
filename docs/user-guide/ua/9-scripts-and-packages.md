# Скрипти й пакети

Проєкт може запускати ваші власні скрипти на TypeScript, які працюють із CRM тим самим кодом, що й
CLI: вхід, запити, розташування файлів. Скрипт — це файл у `scripts/`, який запускається через Bun.

## Підготовка

Пакети беруться з репозиторію Zoho Studio, а не з реєстру. Один раз на комп'ютері, у цьому
репозиторії:

```bash
bun run link
```

Потім у проєкті:

```bash
bun install
bun run scripts/example.ts
```

Посилання стежить за репозиторієм: після оновлення Zoho Studio проєкт використовує нову версію без
перевстановлення. Для всього, що звертається до Zoho, проєкт має бути авторизований
(`zoho-studio login`).

## Пакети

| Пакет | Що він дає скрипту |
|---|---|
| `@zoho-studio/zoho-crm` | запити до Zoho CRM, сутності (модулі, поля, функції, …), завантаження, міграції |
| `@zoho-studio/core` | проєкт і його налаштування, запис файлів у `src/`, лог |
| `@zoho-studio/auth` | вхід і токени доступу — скриптам рідко потрібен, запити до CRM входять самі |

Усе з `@zoho-studio/zoho-crm` імпортується з самого пакета:

```ts
import { createFieldsRequest, getFieldsListRequest, getModulesListRequest } from '@zoho-studio/zoho-crm'
```

## Запити

Функція, що надсилає запит до Zoho, закінчується на `Request`, тож одразу видно, що звертається до
CRM. Вона сама знаходить проєкт, додає токен доступу й оновлює його за потреби — скрипт викликає її
як звичайну функцію.

```ts
import { getFieldsListRequest, getModulesListRequest } from '@zoho-studio/zoho-crm'

const modules = await getModulesListRequest()
const custom = modules.filter((module) => module.generated_type === 'custom')

for (const module of custom) {
    const fields = await getFieldsListRequest(module.api_name)
    console.log(`${module.api_name}: ${fields.length} fields`)
}
```

Наявні запити за сутностями:

| Сутність | Запити |
|---|---|
| організація | `getOrganizationRequest` |
| модулі | `getModulesListRequest`, `createModuleRequest` |
| поля | `getFieldsListRequest`, `getFieldsPageRequest`, `createFieldsRequest` |
| профілі | `getProfilesListRequest` |
| функції | `getFunctionsListRequest`, `getFunctionsPageRequest`, `getFunctionCodeRequest` |
| правила робочих процесів | `getWorkflowRulesListRequest`, `getWorkflowRulesPageRequest`, `getWorkflowRuleRequest` |
| дії робочих процесів | `getWorkflowActionsListRequest`, `getWorkflowActionsPageRequest`, `getWorkflowActionRequest` |
| вебхуки | `getWebhooksListRequest`, `getWebhooksPageRequest`, `getWebhookRequest` |
| глобальні списки вибору | `getGlobalPicklistsListRequest`, `getGlobalPicklistsPageRequest`, `getGlobalPicklistRequest` |
| клієнтські скрипти | `getClientScriptPagesListRequest`, `getClientScriptsListRequest`, `getClientScriptSourceRequest` |
| статичні ресурси | `getStaticResourcesListRequest`, `getStaticResourceContentRequest` |

`…ListRequest` повертає всі елементи, сам проходячи сторінками Zoho; `…PageRequest` повертає одну
сторінку. Редактор показує параметри й форму результату кожного запиту.

**`createModuleRequest` і `createFieldsRequest` змінюють CRM**, і створений модуль нічим не
скасувати. Для створення модулів і полів безпечніша [міграція](7-migrations.md): вона спершу
перевіряє і питає, перш ніж щось надіслати.

### Ендпоінт без готового запиту

`crmClient` надсилає будь-який запит до API CRM з авторизацією проєкту, відносно
`<api.baseUrl>/crm/<api.version>`:

```ts
import { crmClient } from '@zoho-studio/zoho-crm'

const { data } = await crmClient.get('/settings/layouts', { params: { module: 'Leads' } })
```

Це екземпляр [axios](https://axios-http.com), тож `get`, `post`, `put` і `delete` працюють так, як
описано в axios. Коли Zoho відхиляє запит, `describeRequestError(error)` перетворює помилку на
власне повідомлення Zoho.

## Окрім запитів

- **Завантаження:** ті самі функції, що їх запускають команди, можна викликати зі скрипту,
  наприклад щоб оновити поля одного модуля після змін —
  `await pullFields({ module: 'Leads' }, silentPullProgress)`, де `silentPullProgress` з
  `@zoho-studio/core` нічого не друкує.
- **Проєкт:** `getProjectSettings()` з `@zoho-studio/core` повертає папку проєкту та його
  налаштування.
- **Файли:** `writeArtifactJson(projectPath, ['zoho-crm', 'reports', 'leads.json'], data)` з
  `@zoho-studio/core` пише в `src/`, роблячи назви папок і файлів безпечними.

`scripts/example.ts` у новому проєкті — готовий скрипт, з якого можна почати.
