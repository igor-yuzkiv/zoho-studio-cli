# Проєкт віджета, який пакує zet

Що CLI `zet` від Zoho очікує від віджета і як налаштувати Vite-проєкт (Vue, React), щоб він цьому відповідав. Перевірено на `zoho-extension-toolkit` 1.0.12 станом на 2026-11-28: `zet init`, `zet validate`, `zet pack` на чистому проєкті, проєкті Vue і проєкті React.

## Що потрібно zet

- `plugin-manifest.json` у корені проєкту. Для Zoho CRM це `{ "service": "CRM" }`.
- `app/` з файлами віджета; `zet init` називає сторінку `app/widget.html`, але підходить будь-який `.html` в `app/` — Zoho відкриває сторінку, яку називають налаштування віджета.
- `zet pack` записує `dist/<folder name>.zip` **лише з файлами з `app/`** — без `plugin-manifest.json`, `package.json` чи вихідного коду.
- Файли, які він бере, за розширенням: `.html`, `.js`, `.css`, `.json`, `.txt`, `.md`, `.xml`, зображення `.jpg .jpeg .png .gif .svg`, шрифти `.woff .woff2 .ttf .eot`, медіа `.webm .mp3 .mp4`. **Будь-який інший файл мовчки пропускається** — `.map`, `.ico`, `.webp`, `.mjs`, `.wasm`. Файли й папки, що починаються з `.`, пропускаються.
- Назви папок в `app/`: лише `A-Z a-z 0-9 _ - $`; інший символ зупиняє `zet pack`.
- `zet validate` (його запускає і `zet pack`): щонайбільше 250 файлів, щонайбільше 5 МБ на файл.
- `zet run` обслуговує `app/` за `https://127.0.0.1:5000/app/` із самопідписаним сертифікатом; браузер має один раз його прийняти. Для локального тестування з zoho-studio простіший dev-сервер Vite по http.
- Сторінка віджета сама завантажує SDK: `<script src="https://live.zwidgets.com/js-sdk/1.5/ZohoEmbededAppSDK.min.js"></script>`. `zet init` його не додає.

`zet init --zoho-service CRM --project-name <name>` створює чистий проєкт без питань; він також запускає `npm install` для свого `server/`.

## Vite-проєкт як проєкт zet

Vite-проєкт і є проєктом zet: `widgets/<name>/src/` (або зовнішня папка) містить обидва.

- Заготовка: `bunx --bun create-vite <folder> --template vue-ts` (або `react-ts`, `vanilla-ts`) `--no-interactive`, потім `bun install`. `--bun` запускає інструменти на Bun: Vite 8 і create-vite потребують новішого Node, ніж є на багатьох машинах.
- `plugin-manifest.json`: `{ "service": "CRM" }`.
- `vite.config.ts` — збирати в `app/` з відносними шляхами й обслуговувати за фіксованою адресою:

  ```ts
  export default defineConfig({
    plugins: [vue()], // or react()
    base: './',
    build: { outDir: 'app', emptyOutDir: true },
    server: { host: '127.0.0.1', port: 5173, strictPort: true },
  })
  ```

  Другий віджет бере інший порт.
- `index.html` — скрипт SDK у `<head>`, перед module-скриптом застосунку.
- Точка входу (`src/main.ts`, `src/main.tsx`) — монтуй застосунок усередині `PageLoad` і реєструй його перед `init()`; імпорт стилів із шаблону залиш:

  ```ts
  declare const ZOHO: any

  ZOHO.embeddedApp.on('PageLoad', (data: unknown) => {
    createApp(App, { pageLoad: data }).mount('#app') // React: createRoot(...).render(<App />)
  })
  ZOHO.embeddedApp.init()
  ```

- Скрипти `package.json`: `"dev": "bun --bun vite"`, `"build": "bun --bun vite build"`, `"pack": "bun --bun vite build && zet pack"`.
- `.gitignore` проєкту: `node_modules`, `app`, `dist` — `app/` є результатом збирання.

Для емулятора: `url` — `http://127.0.0.1:5173/`, `run.command` — `bun --bun vite`. Збирання для Zoho: `bun run pack` → `dist/<folder>.zip`.
