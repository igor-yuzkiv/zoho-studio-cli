# Фаза «Local Development: CRM Functions»

Гілка: `feature/local-dev-functions`

Мета першої ітерації: підготовча інфраструктура для локальної розробки й функції Zoho CRM. Функцію створюють
у `workspace/zoho-crm/`, публікують у CRM, після чого pull кладе її копію в `src/zoho-crm/`.

Поки підтримуємо лише рантайм `Deluge 1.0`.

## Ухвалені рішення

### Команди

- `z-crm:functions:make` — інтерактивний квіз, який створює заготовку функції у workspace. Працює офлайн:
  не потребує логіну і попереднього pull.
- `z-crm:functions:deploy` — публікує функцію з workspace у CRM (`--path <dir>` або `--name <api_name>`,
  `--changelog "<текст>"`).
- `z-crm:org:info` лишається без змін.
- Окремої команди для env-метаданих (runtimes, categories) у цій ітерації немає. Категорії й типи
  повернення для Deluge беремо з документації і тримаємо константою в `zoho-crm.config.ts`. Якщо
  вибрано категорію, недоступну в редакції CRM, Zoho відповідає на деплой `INVALID_DATA`, і цього
  достатньо. Команду додамо, коли знадобляться інші рантайми або перевірка `allowed` до деплою.

### Структура workspace

У шаблон проєкту (`template/`) додаємо `workspace/zoho-crm/`.

```text
workspace/zoho-crm/functions/<api_name>/
  <api_name>.deluge
  <api_name>.json
```

Папку й файли називаємо за `api_name`, бо його не можна змінити після створення (update відповідає
`NOT_ALLOWED`), а `name` перейменовується. Папка має ту саму назву, що й у `src/zoho-crm/functions/<api_name>/`.

### `<api_name>.json`

```json
{
  "id": null,
  "name": "oz_wf_programs_refresh_pricing",
  "api_name": "oz_wf_programs_refresh_pricing",
  "description": "",
  "runtime": "Deluge 1.0",
  "category": "Automation",
  "releases": [
    { "date": "2026-10-17T14:02:11Z", "action": "create", "changelog": "Initial version" }
  ]
}
```

- Тип повернення й аргументи живуть лише в оголошенні в `.deluge`, бо Zoho бере їх звідти.
- Деплой записує `id` після першого створення.
- `releases` — локальний журнал змін. Get, list і download code не повертають changelog, тож локальний
  запис буде єдиною копією, яку можна читати. Знімків коду не зберігаємо: код версіонує git.

### Деплой

- Якщо `id` є, деплой оновлює функцію (`PUT /settings/functions/{id}`), якщо немає — створює
  (`POST /settings/functions`, multipart: `metadata` + `code` у вигляді `.ds`).
- Changelog іде в `publish.changelog`. Без `--changelog` команда питає його в інтерактиві; без TTY
  він необов'язковий.
- Запис у `releases` додається лише після успішної відповіді Zoho.
- Після успішного деплою функція одразу витягується в `src/zoho-crm/functions/`.
- Deluge публікується автоматично при create/update, тож окремий publish (`/actions/publish`) не потрібен.

### Шаблон імені функції

Формат: `<vendor>_<category>_<?module>_<what>`, наприклад `oz_wf_programs_refresh_pricing`.

Налаштування в `.zoho-studio/settings.json`; секція `zohoCrm` нова:

```json
"zohoCrm": {
  "functions": {
    "naming": {
      "enabled": true,
      "vendor": "oz",
      "categoryPrefixes": {
        "Button": "btn",
        "Automation": "wf",
        "Schedule": "sh",
        "Related List": "rl",
        "Standalone": "sa",
        "Signals": "sig",
        "Validation Rule": "vr"
      }
    }
  }
}
```

- `enabled: false` вимикає шаблон: квіз просто питає api_name.
- Порожній `vendor` прибирає перший сегмент.
- `categoryPrefixes` має дефолти; у налаштуваннях достатньо перевизначити потрібні.

### Квіз `functions:make`

1. Категорія (Deluge: Button, Automation, Schedule, Related List, Standalone, Signals, Validation Rule).
2. Тип повернення — лише коли є вибір (Automation: `void` або `string`).
3. Модуль, необов'язково: вибір з витягнутих модулів (`src/zoho-crm/modules`), «ввести вручну» або
   «без модуля». Вільний текст потрібен для власних скорочень на кшталт `clr`.
4. Що робить функція, вільним текстом. CLI приводить його до `lower_snake_case`, слова не склеює.
5. CLI показує зібраний api_name з можливістю відредагувати.
6. Display name; за замовчуванням дорівнює api_name.
7. Опис.
8. Аргументи (ім'я + тип).

Результат: `<api_name>.json` і `<api_name>.deluge` із заготовкою оголошення
`<return_type> <category_snake>.<name_snake>(<args>)`.

### Правила, які перевіряємо локально

- `name`: 3–100 символів, починається з літери; дозволені літери, цифри, пробіл, `-`, `_`.
- `api_name`: те саме, але без пробілу.
- `description`: до 3000 символів.
- Тип повернення залежить від категорії:

| Категорія | Тип повернення |
|---|---|
| Button, Related List, Standalone | `string` |
| Automation | `void` (за замовчуванням) або `string` |
| Schedule, Signals | `void` |
| Validation Rule | `map` |

### Права доступу

Нового OAuth-скоупу не треба: create і update покриває `ZohoCRM.settings.ALL`, а він уже є серед
стандартних скоупів у `default.settings.ts`.

## Перевірити на реальному org (записати в `zoho-findings/functions.md`)

- Регістр імені в оголошенні: текст доки вимагає lowercase через `_`, а приклад у ній використовує
  camelCase (`standalone.restoreDealByNameTest`).
- Що повертає create/update при `COMPILATION_ERROR` (рядок і позиція помилки), щоб показати це
  користувачу.
- Як поводиться `PUT` за `id` функції, яку видалили в CRM.

## Відкрите

- Що робити, коли `id` порожній, а функція з таким `api_name` у CRM уже є (`DUPLICATE_DATA`):
  зупинитися з підказкою чи запропонувати прив'язати локальну функцію до наявної.
- Як зберігати `id`: як рядок, бо Zoho повертає його рядком. Звірити з іншими сутностями.
- Скорочення `sh`, `rl`, `sig`, `vr` запропоновані, ще не підтверджені.

## Попередня декомпозиція

1. **Workspace у шаблоні й конфігурації.** `template/workspace/zoho-crm/`, шляхи в `core/config.ts` і
   `zoho-crm.config.ts`, оновити `init`.
2. **Налаштування `zohoCrm.functions.naming`.** Типи, дефолти, злиття з `settings.json`, документація
   налаштувань.
3. **Модель функції у workspace.** Типи `<api_name>.json`, читання й запис, константи категорій і типів
   повернення, валідація name/api_name/description, побудова імені за шаблоном, генерація оголошення.
4. **`z-crm:functions:make`.** Квіз, створення файлів, документація (en/ua), README.
5. **Запити create і update.** `create-function.request.ts`, `update-function.request.ts` (multipart),
   тести на `Bun.serve`.
6. **`z-crm:functions:deploy`.** Вибір create чи update, changelog, `releases`, запис `id`, pull функції
   в `src/`, обробка помилок Zoho, документація (en/ua), README, findings.
