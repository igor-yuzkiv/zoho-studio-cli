# `zoho-studio browser`

Opens the project in a local web app: the artifacts under `src/` are browsed in the page, and any
group of them can be pulled again from it. Run it inside a project folder.

```bash
zoho-studio browser               # free port, opens the default browser
zoho-studio browser --port 4321   # fixed port
zoho-studio browser --no-open     # start the server only
```

```text
Zoho Studio is running at http://127.0.0.1:41853/
Press Ctrl+C to stop.
```

The server listens on `127.0.0.1` only. It can run pulls with the project's stored tokens, so it
is never reachable from other machines, and it answers only its own page: a request from another
site open in the same browser, or one addressed to another host name, is refused. It keeps running until you stop it with Ctrl+C.

## Pulling from the page

A pull started from the page runs the same code as the matching `z-crm:*:pull` or
`z-projects:*:pull` command, with the same options and the same files written. Only one pull runs
at a time: the pulls share the project folders and the token store, so a second one is refused
until the first finishes. The page shows the progress and, at the end, the same summary the
command prints.

## The log

The overview ends with the project log — the file every command writes to, `logs.file` in the
[settings](2-settings.md) — newest entry first. Older entries load as you scroll, and an entry
opens to show the rest of its fields.

## Logging in from the page

The footer of the sidebar shows whether the project has a refresh token stored, with a button that
starts the same device flow as [`zoho-studio login`](4-login-command.md): the page shows the
verification link and the code to enter, waits for the approval, and stores the tokens in the
project settings. A pull that fails because the project is not logged in offers the same button.

## Running from source

The executable from `bun run compile` carries the page inside it, so `zoho-studio browser` works
wherever the file is copied. When the CLI runs from source, the page is served from `dist/web`
instead, so build it first:

```bash
bun run build:web
bun run dev -- browser
```

While working on the page itself, run the server with a fixed port and the Vite dev server next to
it; Vite forwards `/api` to the server:

```bash
bun run dev -- browser --port 4321 --no-open   # inside a project folder
bun run dev:web                                # in this repository
```

## HTTP API

The page talks to the server over JSON; a `POST` must send `Content-Type: application/json`. Paths are relative to the project's `src/`; a path that
would leave `src/` is refused.

| Method and path | Returns |
|---|---|
| `GET /api/project` | project name and paths, the stored organization, whether a refresh token is stored |
| `GET /api/groups` | every artifact group with its pull command, options, folder, artifact count and newest file time |
| `GET /api/tree?path=&depth=` | the files and folders below a path |
| `GET /api/file?path=` | one file as it is on disk, always as plain text |
| `GET /api/json?path=` | every JSON file below a path, parsed, keyed by its path |
| `GET /api/pulls` | the recent pulls, newest first |
| `POST /api/pulls` | starts a pull: `{ "area": "crm", "group": "fields", "options": { "module": "Leads" } }`; `409` while another one runs |
| `GET /api/logs?before=&limit=` | the project log, newest first, a page at a time; `nextCursor` reads the older page |
| `GET /api/login` | the state of the login started from the page |
| `POST /api/login` | starts a login; `409` while one waits for approval |
| `GET /api/events` | a server-sent event stream with every change to a pull or the login |
