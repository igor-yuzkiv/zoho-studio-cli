# A widget project that zet packs

What Zoho's `zet` CLI expects of a widget, and how a Vite project (Vue, React) is set up to meet it. Checked against `zoho-extension-toolkit` 1.0.12 on 2026-11-28: `zet init`, `zet validate`, `zet pack` on a plain project, a Vue project and a React project.

## What zet needs

- `plugin-manifest.json` at the project root. For Zoho CRM it is `{ "service": "CRM" }`.
- `app/` with the widget's files; `zet init` names the page `app/widget.html`, but any `.html` in `app/` works — Zoho opens the page the widget's settings name.
- `zet pack` writes `dist/<folder name>.zip` with **only the files under `app/`** — not `plugin-manifest.json`, `package.json` or sources.
- Files it takes, by extension: `.html`, `.js`, `.css`, `.json`, `.txt`, `.md`, `.xml`, images `.jpg .jpeg .png .gif .svg`, fonts `.woff .woff2 .ttf .eot`, media `.webm .mp3 .mp4`. **Any other file is left out silently** — `.map`, `.ico`, `.webp`, `.mjs`, `.wasm`. Files and folders starting with `.` are skipped.
- Folder names under `app/`: only `A-Z a-z 0-9 _ - $`; another character stops `zet pack`.
- `zet validate` (also run by `zet pack`): at most 250 files, at most 5 MB per file.
- `zet run` serves `app/` at `https://127.0.0.1:5000/app/` with a self-signed certificate; the browser has to accept it once. For local testing with zoho-studio, a Vite dev server on http is simpler.
- The widget page loads the SDK itself: `<script src="https://live.zwidgets.com/js-sdk/1.5/ZohoEmbededAppSDK.min.js"></script>`. `zet init` does not add it.

`zet init --zoho-service CRM --project-name <name>` creates the plain project without questions; it also runs `npm install` for its `server/`.

## A Vite project as a zet project

The Vite project is the zet project: `widgets/<name>/src/` (or the external folder) holds both.

- Scaffold: `bunx --bun create-vite <folder> --template vue-ts` (or `react-ts`, `vanilla-ts`) `--no-interactive`, then `bun install`. `--bun` runs the tools on Bun: Vite 8 and create-vite need a newer Node than many machines have.
- `plugin-manifest.json`: `{ "service": "CRM" }`.
- `vite.config.ts` — build into `app/` with relative paths, and serve on a fixed address:

  ```ts
  export default defineConfig({
    plugins: [vue()], // or react()
    base: './',
    build: { outDir: 'app', emptyOutDir: true },
    server: { host: '127.0.0.1', port: 5173, strictPort: true },
  })
  ```

  A second widget takes another port.
- `index.html` — the SDK script in `<head>`, before the app's module script.
- The entry (`src/main.ts`, `src/main.tsx`) — mount the app inside `PageLoad`, and register it before `init()`; keep the template's style import:

  ```ts
  declare const ZOHO: any

  ZOHO.embeddedApp.on('PageLoad', (data: unknown) => {
    createApp(App, { pageLoad: data }).mount('#app') // React: createRoot(...).render(<App />)
  })
  ZOHO.embeddedApp.init()
  ```

- `package.json` scripts: `"dev": "bun --bun vite"`, `"build": "bun --bun vite build"`, `"pack": "bun --bun vite build && zet pack"`.
- `.gitignore` of the project: `node_modules`, `app`, `dist` — `app/` is build output.

For the emulator: `url` is `http://127.0.0.1:5173/`, `run.command` is `bun --bun vite`. A build for Zoho: `bun run pack` → `dist/<folder>.zip`.
