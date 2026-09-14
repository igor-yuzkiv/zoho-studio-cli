# Reference: layout and the artifact graph

Where each artifact type lands, and the exact JSON keys that connect one to another. The
layout is fixed by the `zoho-studio` CLI and no setting moves it, so it is the same in every
pulled project.

## Layout

| Artifact | Path | Contents |
|---|---|---|
| Function | `src/zoho-crm/functions/<api_name>/` | `<Name>.deluge` (source) and `<Name>.metadata.json` (arguments, return type, category, `rest_api_mode`, id) |
| Module | `src/zoho-crm/modules/<Module>/<Module>.metadata.json` | module definition |
| Field | `src/zoho-crm/modules/<Module>/fields/<Field_api_name>.json` | full field definition — type, picklist values, permissions |
| Workflow rule | `src/zoho-crm/workflows/<Name>.json` | trigger, conditions, and the actions each condition fires |
| Workflow action | `src/zoho-crm/workflow-actions/<type>/<Name>.json` | the action's own configuration |
| Webhook | `src/zoho-crm/webhooks/<Name>.json` | url, method, headers, body template, authentication |
| Global picklist | `src/zoho-crm/global-picklists/<api_name>.json` | the picklist and its values |
| Organization | `.zoho-studio/org.json` | org snapshot, outside `src/zoho-crm/` |

Workflow-action subdirectories: `email-notifications`, `field-updates`, `tasks`,
`functions`, `webhooks`.

A function without a `.deluge` file is normal — the org holds functions whose source Zoho
does not return. Metadata alone is not evidence that a function is empty.

## Edges

Each row is a key you can read and follow. Nothing here is a guess from a name.

| From | Key | To |
|---|---|---|
| Workflow rule | `module.api_name` | `src/zoho-crm/modules/<Module>/` |
| Workflow rule | `execute_when.details.trigger_module.api_name` | the module whose records fire it |
| Workflow rule | `conditions[].instant_actions.actions[]` → `{name, id, type}` | `src/zoho-crm/workflow-actions/<type>/<name>.json`, with `_` in `type` becoming `-` in the directory name |
| Workflow action | `module.api_name` | `src/zoho-crm/modules/<Module>/` |
| Workflow action (functions) | `function.api_name` | `src/zoho-crm/functions/<api_name>/` |
| Workflow action (functions) | `arguments[].value` — `${!Module.Field}` | the module field supplying the argument |
| Webhook | `module.api_name` | `src/zoho-crm/modules/<Module>/` |
| Webhook | `url` | an external system — outside this repository |
| Webhook | `body.raw_data_content` — `${!Module.Field}` | the fields it sends |
| Field | `lookup.module.api_name` | the module it points at |
| Field | `global_picklist` → `{api_name, id}` | `src/zoho-crm/global-picklists/<api_name>.json` |

This table is what has been confirmed, not a proof of completeness. The field rows cover
lookups and global picklists; other data types — formula, rollup summary — may carry
references of their own, so read such a field's own JSON before concluding it has none.

Action types observed in workflow rules are exactly the five above. `scheduled_actions` sits
beside `instant_actions` on every condition and holds actions scheduled rather than
immediate; it is null in orgs that use none, and where it is populated expect the same
`{name, id, type}` reference shape — verify against the file rather than assuming it.

## Where the graph ends

**Deluge is text.** A function that calls another function, reads a module, or posts to an
external service does so in code, and none of it is a structured reference. Finding those
links means searching `.deluge` files, and the result is as complete as the patterns tried.
Report such a link as found by text search, never as a graph edge.

**Naming conventions are hints.** Many orgs encode intent in prefixes — a `wf_` function is
probably called from a workflow. Probably is not evidence: confirm with the workflow-action
file that names it. The project's own instructions describe its conventions.

**There is no reverse index.** Every edge above points one way. Answering "what uses this"
is a search across `src/zoho-crm/` for the `api_name`, in each of the spellings it appears under.

## What the files will not tell you

**The filename is not an identifier.** Workflow rules, workflow actions, webhooks, and
global picklists are named after the record. When two records in one directory share a name,
the CLI appends the id — `<name>.<id>.json`. Which of the two forms a given file takes can
change between pulls, so match on the `id` inside the file, not on its name.

Filenames are Zoho display names verbatim, so they contain spaces, dots, colons, and `${…}`.
Always quote paths.

**The JSON is wider than any documented type.** Each file holds Zoho's full response,
unfiltered. Read the file to learn what a record carries; do not conclude a key is absent
because some type definition omits it.

**`src/zoho-crm/` is the last pull, not the org.** Each pull replaces its directory wholesale, so an
artifact deleted upstream disappears rather than lingering, and a finding is only true for
the state it was made against. Fields require modules to have been pulled first, so a module
with no `fields/` directory may mean the fields were never pulled — not that it has none.

A workflow action that Zoho listed but returned no detail for is saved from the list payload,
so an unusually thin action file is a partial record rather than a simple one.
