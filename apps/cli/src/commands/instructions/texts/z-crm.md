# z-crm — Zoho CRM

Commands for one Zoho CRM organization: the one the project is logged in to. Check which one with
`z-crm:status` before anything that writes.

## What there is

- **Organization** — `z-crm:status` (quick connection check), `z-crm:org:info` (full record into
  `.zoho-studio/org.json`).
- **Metadata pulls** — `z-crm:<thing>:pull` download metadata into `data/zoho-crm/`, read-only:
  modules, fields, layouts (with formula expressions), workflow rules, workflow actions, webhooks,
  global picklists, profiles, client scripts (with their JS source), static resources.
- **Functions** — `z-crm:functions:*`: pull, scaffold or import into `src/`, run, deploy. The only
  thing the CLI deploys.
- **Migrations** — `z-crm:migrations:make` creates a file; `bun run migrate` in the project creates
  modules and fields from it.
- **Widgets** — `z-crm:widgets:*`: run a widget locally against an emulated CRM with mocked SDK
  answers, and e2e-test it with Playwright.

## Pulls

- `data/zoho-crm/` mirrors the last pull: unchanged files are left alone, changed ones are
  rewritten, items deleted in Zoho move to `data/.removed/<date-time>/`. Local edits in `data/` are
  lost.
- `z-crm:modules:pull` must run before `z-crm:fields:pull` and `z-crm:layouts:pull`: those walk the
  local module folders.
- Pulls run their requests one at a time with a delay (Zoho API limits), so a large organization
  takes minutes.
- A missing scope shows up as `OAUTH_SCOPE_MISMATCH`: the scope must be in `auth.scopes` and the
  person has to run `zoho-studio login` again.
- The pulled snapshot is the current state only — Zoho exposes no history. git is the history.

## Reading `data/zoho-crm/`

Every file holds the record exactly as Zoho returned it, JSON with a four-space indent. Names keep
Zoho's names; only characters a path cannot hold are replaced, and a name two items share gets the
second item's id appended.

```text
data/zoho-crm/
  modules/<Module>/
    <Module>.metadata.json        # the module (by API name)
    fields/<Field>.json           # one per field: type, picklist values, lookup target
    layouts/<Layout>.json         # sections and their fields; formula expressions live only here
  workflows/<Rule>.json           # criteria, instant and scheduled actions — as references
  workflow-actions/
    email-notifications/ field-updates/ tasks/ webhooks/ functions/   # <Action>.json, full config
  webhooks/<Webhook>.json         # url, method, body, headers, authentication (no secrets)
  functions/<api_name>/           # <Display Name>.metadata.json and .deluge
  client-scripts/<Module label>/<page>/<Script>.<id>/   # .metadata.json and .js; _no-module/commands
  static-resources/user|crm|internal/<Resource>.<id>/   # user = uploaded here; crm, internal = Zoho's
  global-picklists/<Picklist>.json
  profiles/<Profile>.json
```

What refers to what:

- A **workflow rule** lists its actions by name, id and type; the action bodies are in
  `workflow-actions/<type>/` (match by id), and a webhook action's full request also in `webhooks/`.
- A **functions action** names the function and its arguments; the code is in
  `functions/<api_name>/`.
- A **client script** belongs to a page — a module screen (`module_create`, `module_edit`,
  `module_clone`, `module_detail`, `module_view_canvas`) of one layout, or `commands`; `page.metadata.json`
  in the page folder describes it. Static resources are the libraries scripts load.
- A **formula field** has its return type in `fields/` and its expression in `layouts/`.
- **Profiles** are what a migration's `profiles` names.

To answer "what happens when a <record> is created or edited": the module's rules in `workflows/`
(filter by the module in each file) → their actions → webhook requests and function code; then the
client scripts of the module's create/edit pages for what the UI does. Not on disk: blueprints,
assignment rules, buttons, custom views, record data — say so rather than guess.

## Writes to the organization

`z-crm:functions:deploy`, `z-crm:functions:run`, and `bun run migrate`. Everything else here reads.
