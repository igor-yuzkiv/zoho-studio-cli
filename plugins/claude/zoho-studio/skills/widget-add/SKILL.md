---
name: widget-add
description: Adds a Zoho CRM widget to a zoho-studio project — registers an existing widget (in the project or an external folder) so the emulator can run and test it, or creates a new one on Vue, React or plain HTML that runs in the emulator and packs with Zoho's zet. Use when the person asks to add, create, set up, scaffold or connect a widget, or to start a widget on Vue or React.
---

# Widget add

Brings a widget into a project so that `z-crm:widgets:serve` runs it and its tests work, and for a new widget, so that `zet pack` builds what Zoho takes. The widget folder and `widget.json` are described by `zoho-studio instructions z-crm:widgets` — read it first. What `zet` expects and how a Vite project meets it is in [references/zet-project.md](references/zet-project.md); read it before creating a widget. Testing the widget afterwards is `/zoho-studio:widget-testing`.

## Goal

`widgets/<name>/widget.json` describes the widget, the emulator opens it — started by its `run` command when it has one — and a new widget also passes `zet pack`.

## Workflow

1. **Ask what is needed**, unless the person said: an existing widget or a new one; for a new one, the framework (Vue, React, or plain HTML) and where the code lives — `widgets/<name>/src/` (the default) or a folder outside the project; and the widget's name. The name becomes the folder name: lowercase, digits and `-`.
2. **An existing widget.** Find its folder and how it is started (its `package.json` scripts, its README); ask the person when unsure. Do not copy or move its code: an external widget stays where it is and `--source` points at it. Find the address it serves the widget page at. Go to step 4.
3. **A new widget.** Say what will be downloaded — the create-vite template and the npm packages — and wait for the person's agreement. Then set the project up by the reference: scaffold, `plugin-manifest.json`, `vite.config.ts`, the SDK script, mounting inside `PageLoad`, the scripts, `.gitignore`. Plain HTML takes `zet init --zoho-service CRM --project-name <name>` instead, and its `app/widget.html` gets the SDK script; it is served by `zet run` over https, or by any static server over http.
4. **Register it** with `zoho-studio z-crm:widgets:make --name=<name> --url=<address> --run=<command>`, adding `--source=<path>` for a widget outside `widgets/<name>/src/`. `make` refuses a name that exists: then edit `widget.json` instead.
5. **Check it opens.** `zoho-studio z-crm:widgets:serve --widget=<name>` in the background: the emulator starts the widget and prints an address. A start failure names the command and its output; a page that says the widget did not register means the SDK script or `init()` is missing. Stop the emulator afterwards — it stops the widget too.
6. **Check it packs** — a new widget, or an existing one the person packs with zet: `bun run pack` (or `zet pack`) in the widget's folder, then list the zip. A file the widget needs that is missing from the zip has an extension zet leaves out (the reference lists them).
7. **Hand over** and offer `/zoho-studio:widget-testing` to cover the widget with tests.

## Rules

- Downloads and installs run only after the person agreed to them: a scaffold pulls a template and packages from the internet. `zet` is a dependency of the plugin (`references/dependencies.md`); when it is missing, offer `/zoho-studio:setup` rather than installing it here.
- Keep the widget's code in its own project: zoho-studio needs only `widget.json` and the testing files, so the widget stays buildable and packable on its own.
- Run Vite and create-vite with `--bun` (`bun --bun vite`, `bunx --bun create-vite`): on an older Node they fail, on Bun they work.
- One port per widget: a second widget's `server.port` and `url` take the next free port, or the first widget's `run` keeps answering for both.

## Output

- The widget's folder, its `widget.json`, and the address the emulator printed.
- For a new widget: the framework, the files created, and the zip `zet pack` produced, with its file list.
- What the person still has to do: upload the zip to Zoho, or point the widget's settings in Zoho at the page.
