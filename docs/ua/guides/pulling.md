# Завантаження

Завантаження переносить ресурси з CRM у `data/zoho-crm/`. Для кожного виду ресурсів є своя
команда, а **пресет** запускає кілька з них поспіль.

**Завантаження віддзеркалює CRM у папці, куди записує.** Файл, вміст якого не змінився, лишається як є; змінений перезаписується, тож локальні зміни в цих папках буде перезаписано — зберігайте їх у git. Файл того, що видалили в CRM, не видаляється: він переїжджає в `data/.removed/<дата-час>/` за тим самим шляхом, який мав у `data/`, а завантаження друкує рядок `Moved N removed files to data/.removed/<date-time>/`. Усі кроки одного пресету складають файли в одну таку папку. `data/.removed/` ніхто не прибирає; видаляйте те, що більше не потрібно. Проєкт, створений `init`, тримає її поза git; у старішому проєкті додайте `data/.removed/` у `.gitignore`.

У двох випадках старі файли лишаються на місці:

- Завантаження з `--module` (workflows, workflow actions) відповідає лише за файли цього модуля, решта папки лишається.
- Частина, яку не вдалося завантажити — поля чи layouts модуля, тип дій workflow, — зберігає попередні файли.

Окремий елемент, який не вдалося завантажити всередині частини, — скажімо, код однієї функції, — зберігає попередній файл: у Zoho цей елемент є, тож нічого з нього не переїжджає в `data/.removed/`.

## Усе одразу

```bash
zoho-studio preset pull-crm
```

Вбудований пресет `pull-crm` запускає всі наведені нижче команди в правильному порядку.

## По одному виду

| Команда | Що завантажує | Куди |
|---|---|---|
| `z-crm:org:info` | організацію | `.zoho-studio/org.json` |
| `z-crm:modules:pull` | модулі | `data/zoho-crm/modules/<Module>/` |
| `z-crm:fields:pull` | поля кожного завантаженого модуля | `data/zoho-crm/modules/<Module>/fields/` |
| `z-crm:layouts:pull` | layouts кожного завантаженого модуля із секціями та виразами формул | `data/zoho-crm/modules/<Module>/layouts/` |
| `z-crm:functions:pull` | функції з їхнім кодом Deluge | `data/zoho-crm/functions/` |
| `z-crm:workflows:pull` | правила робочих процесів | `data/zoho-crm/workflows/` |
| `z-crm:workflow-actions:pull` | дії робочих процесів | `data/zoho-crm/workflow-actions/` |
| `z-crm:webhooks:pull` | вебхуки | `data/zoho-crm/webhooks/` |
| `z-crm:global-picklists:pull` | глобальні списки вибору | `data/zoho-crm/global-picklists/` |
| `z-crm:profiles:pull` | профілі | `data/zoho-crm/profiles/` |
| `z-crm:client-scripts:pull` | клієнтські скрипти | `data/zoho-crm/client-scripts/` |
| `z-crm:static-resources:pull` | статичні ресурси | `data/zoho-crm/static-resources/` |

Поля завантажуються для вже завантажених модулів, тому спершу запустіть `z-crm:modules:pull`.
Деякі команди мають опції, наприклад `zoho-studio z-crm:fields:pull --module=Leads` для одного
модуля; їх перелічено на сторінці кожної команди в [технічному довіднику](../reference/README.md#документи).

Більшість команд завантажує елементи поодинці. Коли не вдається завантажити один елемент — скажімо, одну функцію, — така команда повідомляє про це наприкінці, продовжує з рештою і завершується з кодом 1, щоб скрипт чи пресет могли відрізнити часткове завантаження від повного. `z-crm:modules:pull` і `z-crm:profiles:pull` отримують усе одним запитом, тож помилка там зупиняє команду.

## Пресети

Пресет — це іменований список команд у `.zoho-studio/settings.json`:

```json
{
    "presets": {
        "pull-leads": ["z-crm:modules:pull", "z-crm:fields:pull --module=Leads"]
    }
}
```

```bash
zoho-studio preset              # list the presets
zoho-studio preset pull-leads   # run one
```

Пресет зупиняється на першій команді, що завершилася помилкою. Докладніше: [довідник з preset](../reference/project/preset.md).
