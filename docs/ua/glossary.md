# Глосарій

Слова, якими ця документація, повідомлення CLI і код називають те, з чим працює CLI. Кожен термін
означає одне й те саме всюди: коли сторінка каже «snapshot», вона має на увазі саме те, що визначено
тут.

| Термін | Значення |
|---|---|
| **Artifact** | Будь-який об'єкт Zoho CRM, з яким працює CLI: функція, модуль, поле, workflow rule тощо. |
| **Pull** | Завантаження артефактів із Zoho CRM через API командами `z-crm:*:pull`. В інших інструментах це називають fetch. |
| **Snapshot** | Локальна копія стану артефакта в тому вигляді, в якому її завантажив pull. Snapshot-и лежать у `data/zoho-crm/`. |
| **Source** | Код і метадані артефакта, який розробляється локально. Source лежить у `src/zoho-crm/`, і жоден pull його не чіпає. |
| **Import** | Копіювання артефакта зі snapshot-а в source для локальної розробки; його пропонує `z-crm:functions:make`. |
| **Deploy** | Створення або оновлення артефакта в Zoho CRM з його source командою `z-crm:functions:deploy`. |
| **Deployment** | Один deploy, який Zoho прийняв, з датою та операцією (create або update). |
| **Changelog** | Опис зміни, яку приніс deployment. |
| **Deployment History** | Локальний список успішних deployments у `<api_name>.deploy.json` функції. |
| **Scaffold** | Створення перших файлів нового артефакта із шаблону командою `z-crm:functions:make`. |

```text
Zoho CRM ── Pull ──> data/ (snapshots)
                         │
                       Import          Scaffold
                         │                │
                         v                v
                       src/ (source) <────┘
                         │
                       Deploy
                         │
                         v
                      Zoho CRM
```

Snapshot — це стан CRM на момент останнього pull, а не версійована історія: наступний pull його
замінює, і pull ніколи не чіпає source. Deploy теж не робить pull. Кожна pull-команда очищає свою папку перед записом, тож зміна, внесена в snapshot вручну,
зникне при наступному pull цього артефакта. Історію snapshot-ів зберігає git, тому `data/` і
призначений для коміту — див. [проєкт](user-guide/4-project.md#що-потрапляє-в-git).
