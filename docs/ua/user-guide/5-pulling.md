# Завантаження

Завантаження переносить ресурси з CRM у `src/zoho-crm/`. Для кожного виду ресурсів є своя
команда, а **пресет** запускає кілька з них поспіль.

**Завантаження замінює папку, у яку записує.** Те, що видалили в CRM, зникає й локально, тож
файли завжди віддзеркалюють CRM. Локальні зміни в цих папках буде перезаписано — зберігайте їх у git.

## Усе одразу

```bash
zoho-studio preset pull-crm
```

Вбудований пресет `pull-crm` запускає всі наведені нижче команди в правильному порядку.

## По одному виду

| Команда | Що завантажує | Куди |
|---|---|---|
| `z-crm:org:info` | організацію | `.zoho-studio/org.json` |
| `z-crm:modules:pull` | модулі | `src/zoho-crm/modules/<Module>/` |
| `z-crm:fields:pull` | поля кожного завантаженого модуля | `src/zoho-crm/modules/<Module>/fields/` |
| `z-crm:functions:pull` | функції з їхнім кодом Deluge | `src/zoho-crm/functions/` |
| `z-crm:workflows:pull` | правила робочих процесів | `src/zoho-crm/workflows/` |
| `z-crm:workflow-actions:pull` | дії робочих процесів | `src/zoho-crm/workflow-actions/` |
| `z-crm:webhooks:pull` | вебхуки | `src/zoho-crm/webhooks/` |
| `z-crm:global-picklists:pull` | глобальні списки вибору | `src/zoho-crm/global-picklists/` |
| `z-crm:profiles:pull` | профілі | `src/zoho-crm/profiles/` |
| `z-crm:client-scripts:pull` | клієнтські скрипти | `src/zoho-crm/client-scripts/` |
| `z-crm:static-resources:pull` | статичні ресурси | `src/zoho-crm/static-resources/` |

Поля завантажуються для вже завантажених модулів, тому спершу запустіть `z-crm:modules:pull`.
Деякі команди мають опції, наприклад `zoho-studio z-crm:fields:pull --module=Leads` для одного
модуля; їх перелічено на сторінці кожної команди в [технічному довіднику](../technical/1-overview.md#документи).

Коли не вдається завантажити один елемент — скажімо, одну функцію, — команда повідомляє про це
наприкінці й продовжує з рештою.

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

Пресет зупиняється на першій команді, що завершилася помилкою. Докладніше: [довідник з preset](../technical/24-preset-command.md).
