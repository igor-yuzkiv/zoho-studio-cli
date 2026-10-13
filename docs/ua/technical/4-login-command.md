# `zoho-studio login`

Авторизує проєкт у Zoho за допомогою **профілю облікових даних** і зберігає отримані токени
доступу та оновлення в `~/.zoho-studio`, поза проєктом.

```bash
zoho-studio login                         # choose a profile from the list, or create one
zoho-studio login --profile acme          # no questions asked
```

## Профілі

Профіль — це клієнт із Zoho API Console під обраною вами назвою: назва, `Client ID` і
`Client Secret`. Він зберігається один раз, у `~/.zoho-studio/profiles.json`, і з ним може входити
будь-яка кількість проєктів.

Без `--profile` команда `login` показує список збережених профілів із пунктом **Create a new profile**
наприкінці. Створення профілю запитує назву, client id і client secret — секрет приховується, поки
ви його вводите, — і зберігає профіль до початку входу. Іншої команди, щоб додати, переглянути чи
видалити профілі, немає.

`--profile <name>` пропускає список і завершується помилкою, якщо профілю з такою назвою немає.
Коли `login` працює без термінала, у якому можна запитати, і без `--profile`, вона бере єдиний
збережений профіль і відмовляє, коли їх немає або їх кілька.

## Device flow

Вам ніколи не треба копіювати код із консолі Zoho. CLI запитує в Zoho код пристрою, показує вам
короткий код користувача й URL і чекає, поки ви підтвердите запит у браузері:

```text
? Credential profile acme

Open https://accounts.zoho.com/oauth/v3/device in a browser and enter this code:

    A1B2-C3D4

The code is valid for 5 min. Waiting for approval...

Authorized with the "acme" profile. Tokens stored in ~/.zoho-studio.
  access token valid for 60 min

Organization: Acme Inc
  id: 7000000012345
  type: sandbox
  primary email: owner@acme.test

Saved to /projects/acme/.zoho-studio/org.json

The project is authorized.
```

Після збереження токенів `login` читає організацію й записує її в `.zoho-studio/org.json` — те
саме робить [`zoho-studio z-crm:org:info`](10-org-info-command.md). На той момент токени вже
збережено, тож про збій на цьому кроці буде повідомлено, а вхід усе одно вдасться.

Значення токенів ніколи не виводяться. `login` знаходить проєкт, піднімаючись від поточної папки,
тож працює з будь-якої підпапки, і без запитань перезаписує токени попереднього входу.

## Дозволи

`login` запитує в Zoho `auth.scopes` із налаштувань. Див. [2-settings.md](2-settings.md).

## Де зберігаються токени

```text
~/.zoho-studio/
  profiles.json                      # every profile, with its client secret
  projects/
    -home-me-work-acme/
      tokens.json                    # this project's tokens and the profile they were issued for
```

Папку проєкту названо за його абсолютним шляхом, у якому `/` замінено на `-`. Якщо перемістити чи
перейменувати проєкт, його токени лишаються під старою назвою — запустіть `login` знову. Два шляхи
можуть дати одну назву (`/a-b` і `/a/b`); `tokens.json` записує початковий шлях, і проєкт, який
знайде там файл іншого проєкту, зупиняється з помилкою, а не використовує його токени.

Папки створюються доступними для читання лише власнику, а обидва файли записуються з `chmod 0600`.
Вони містять секрети клієнтів і refresh-токени — ставтеся до їх витоку як до витоку пароля.
`ZOHO_STUDIO_HOME` переносить усе сховище в іншу папку.

## Одноразове налаштування клієнта

1. Відкрийте [api-console.zoho.com](https://api-console.zoho.com) під обліковим записом, до даних
   якого потрібен доступ, у дата-центрі, до якого належить цей обліковий запис (`.com`, `.eu`, `.in`, …).
   Якщо це не `.com`, вкажіть `auth.baseUrl` і `api.baseUrl` у налаштуваннях проєкту для цього регіону.
2. Зареєструйте клієнт типу **Non-browser Mobile Applications**. Саме цей тип потрібен для device
   flow — у нього немає redirect URI, тож нічого не має працювати на вебсервері чи локальному порту.
3. Запустіть `login`, виберіть **Create a new profile** і вставте `Client ID` і `Client Secret`.

## Як авторизація зберігається

`login` запускають один раз на проєкт. Токен доступу, який видає Zoho, живе годину, а команди, яким
він потрібен, звертаються до `TokenService` (`packages/auth/src/token.service.ts`), а не читають
сховище самі. Він повертає збережений токен, поки той дійсний, а інакше обмінює refresh-токен — із
клієнтом профілю, для якого видано токени, — на новий токен доступу й записує його назад у
`tokens.json`. Токен, якому лишилося менше хвилини, вважається простроченим, тож його ніколи не
видають перед самим закінченням строку, а одночасні виклики ділять одне оновлення — Zoho обмежує
refresh-токен 10 токенами доступу за 10 хвилин.

Сам refresh-токен не має строку дії. `login` знову знадобиться, лише якщо його відкликали в консолі
Zoho, клієнт замінили або профіль видалили з `profiles.json`.

## Перевірка результату

[`zoho-studio z-crm:status`](5-status-command.md) запитує в Zoho, до якої організації підключено
проєкт, — найшвидше підтвердження, що профіль і `api.baseUrl` правильні.

## Коли вона завершується помилкою

| Повідомлення | Що воно означає |
| --- | --- |
| `No .zoho-studio/settings.json found …` | Ви поза проєктом — запустіть [`zoho-studio init`](3-init-command.md). |
| `There is no credential profile yet …` | Немає термінала, щоб створити профіль, — запустіть `login` інтерактивно. |
| `There is no profile named "…"` | `--profile` називає профіль, якого не збережено. |
| `Several profiles exist …` | Немає термінала, щоб вибрати, — передайте `--profile`. |
| `auth.scopes is empty …` | Немає на що просити дозвіл. |
| `Zoho rejected the request: invalid_client …` | Client id профілю не збігається з консоллю, або `auth.baseUrl` вказує на інший дата-центр. |
| `Zoho rejected the request: invalid_scope …` | Одного з дозволів у `auth.scopes` не існує. |
| `Zoho rejected the request: access_denied …` | Запит відхилили на екрані згоди. |
| `Zoho rejected the request: other_dc …` | Обліковий запис живе в іншому дата-центрі, ніж `auth.baseUrl`. |
| `The device code expired before it was approved.` | Код не ввели вчасно — запустіть `login` знову. |

Zoho повідомляє про ці збої з HTTP 200 і полем `error` у тілі, тож «успішний» запит усе одно може
бути відмовою — CLI вважає їх помилками й нічого не записує. Мережеві збої передаються як є, а
збережені токени лишаються незмінними.
