---
name: sources
description: Where and how to look things up about Zoho CRM development — Deluge functions, the REST API, Client Script, widgets, COQL — in first-hand sources (zoho-studio instructions, context7, the local Zoho CRM OpenAPI spec) instead of answering from memory. Use whenever an agent needs a Zoho CRM fact it has not just read: a Deluge built-in or task, an API endpoint, parameter, limit or error code, a ZDK or widget SDK method, a COQL clause or limit.
---

# Sources

Zoho CRM changes and memory about it is often wrong or outdated. This skill gives the few basics per topic an agent needs to ask the right question, and where to find the answer. It does not repeat the documentation: read the source for the details. What the zoho-studio CLI does is in `zoho-studio instructions`; the order of work in a project is in `/zoho-studio:basics`.

## Goal

Every Zoho fact the answer or the code relies on comes from a source read in this session, and the person can see which one.

## How to look things up

Use the sources in this order and stop at the first that answers:

1. **`zoho-studio instructions`** — where the topic touches the CLI (`… z-crm:functions`, `… z-crm:widgets`, `… z-crm`). It also carries how Zoho really behaves where that differs from the documentation, as observed in real organizations; that wins over the other sources.
2. **context7** — when its tools are available. Ask a focused question; the answer quotes Zoho's pages with their URLs. Libraries: Deluge `/websites/zoho_deluge_help`, REST API v8 and COQL `/websites/zoho_crm_developer_api_v8`, Client Script `/websites/zohocrm_dev_explore_client-script`, widgets `/websites/zohocrm_dev_explore_widgets_v1_5`, the rest of the developer docs `/websites/zoho_crm_developer`.
3. **The Zoho CRM OpenAPI spec** that `/zoho-studio:setup` installs (its location is in `${CLAUDE_PLUGIN_ROOT}/references/dependencies.md`). Under `v8.0/` there is a folder per resource (`record`, `coql`, `functions`, `modules`, `fields`, `layouts`, `org`, …). Read `<resource>/index.md` to pick the operation, then `operations/<operationId>/operation.md` for parameters, body and errors, and `examples/` for real error answers. The OAuth scopes are under `security` of the operation in `<resource>.yaml`. Search with `grep`; do not read a `.yaml` file whole — they are large.
4. **Zoho's documentation** — only when context7 is not available: start from https://www.zoho.com/crm/developer/docs/ (REST API, COQL, Client Script, widgets, functions) or https://www.zoho.com/deluge/help/ (Deluge). Pages on `developer.zoho.com/crm/explore/` render only in a browser and come back empty when fetched.

When sources disagree, say so to the person and go by `instructions`, then the spec, then the documentation. When the organization behaves unlike every source, tell the person what was sent and what Zoho answered: that observation is worth more than any page.

## Topics

### Deluge functions

- Deluge runs on Zoho's servers. A CRM function has a category that decides its return type and where it can be called; the declaration, the categories and how Zoho treats the code are in `zoho-studio instructions z-crm:functions`.
- HTTP calls go through `invokeurl` with a named connection; the `connection:` value is a string literal, not a variable. Connections are set up in the Zoho UI.
- Records are read and written with the `zoho.crm.*` tasks; a write through the API runs workflow rules only when it asks for them (`trigger`).
- Sources: context7 Deluge for built-in functions and `zoho.crm.*` tasks. To try code, `z-crm:functions:run` runs it in the organization for real.

### REST API

- Base address `https://www.zohoapis.<dc>/crm/v8/`, header `Authorization: Zoho-oauthtoken <token>`; modules and fields go by API names, not labels.
- Each operation needs the scopes listed in the spec; a missing one answers `OAUTH_SCOPE_MISMATCH`.
- Lists are paged, and writes take a limited number of records per call; the limits are in `record/index.md` of the spec.
- Sources: the spec for endpoints, parameters, limits and errors; context7 API v8 for concepts and guides. The organization's own modules and fields are already pulled: read them from the project, as `zoho-studio instructions z-crm` describes.

### Client Script

- JavaScript in the CRM page in the browser, through the ZDK API — not Deluge; the page's DOM, `window` and `fetch` are not available to it.
- A script is bound to a module, a layout, a page and an event; on another layout or page it silently does not run. The CLI only pulls scripts; changes are made in the Zoho UI.
- Sources: context7 Client Script — the ZDK API and which events exist on which page. The spec has no Client Script; it covers only the REST calls a script makes.

### Widgets

- HTML and JavaScript in an iframe inside the CRM, talking to it through the JS SDK (`ZOHO.embeddedApp`, `ZOHO.CRM.*`). Handlers registered after `ZOHO.embeddedApp.init()` never fire.
- Built and packed with Zoho's `zet` CLI; hosted by Zoho or at an external HTTPS address.
- Sources: context7 widgets v1.5 for the SDK, what each method answers, and `zet`; the SDK's own source (`zoho/embeddedApp-js-sdk` on GitHub, branch `1.5`, `lib/ZohoCrmHelper.js`) has an example answer for every method. Adding or creating a widget and what `zet` expects — `/zoho-studio:widget-add`; testing a widget locally — `/zoho-studio:widget-testing`.

### COQL

- A SELECT-only query language over CRM records: `POST /crm/v8/coql` with `{"select_query": "…"}`, which needs `ZohoCRM.coql.READ` together with read access to the module.
- Field and module API names only; `LIMIT offset, count` — the offset comes first; three or more WHERE criteria need brackets, as `((A and B) and C)`.
- Sources: context7 API v8 for syntax, joins and limits; error answers — `coql/operations/executeCOQLQuery/examples/` in the spec. A field's type, which decides how it can be filtered, is in the pulled fields of the project.

## Rules

- Name the source of a Zoho fact you rely on — the `instructions` text, the context7 answer with its URL, or the spec file — so the person can check it.
- Prefer a focused lookup to reading a whole document: the sources are large, and reading them whole wastes the session's context.
- Treat a claim from memory, a forum or another team's notes as a guess to verify, not as a fact.

## Output

The answer or the code, with the sources it rests on; where sources disagreed or nothing confirmed a fact, say that.
