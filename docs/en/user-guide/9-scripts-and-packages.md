# Scripts and packages

A project can run TypeScript scripts of your own that talk to the CRM with the same code the CLI
uses: the login, the requests, the file layout. A script is a file in `scripts/`, run with Bun.

## Setting up

The packages come from the Zoho Studio repository rather than from a registry. Once per machine,
in that repository:

```bash
bun run link
```

Then, in the project:

```bash
bun install
bun run scripts/example.ts
```

The link follows the repository: after you pull a newer Zoho Studio, the project uses it without
reinstalling. The project must be logged in (`zoho-studio login`) for anything that calls Zoho.

## The packages

| Package | What it gives a script |
|---|---|
| `@zoho-studio/zoho-crm` | requests to Zoho CRM, the entities (modules, fields, functions, …), pulls, migrations |
| `@zoho-studio/core` | the project and its settings, writing files under `data/`, the log |
| `@zoho-studio/auth` | the login and access tokens — scripts rarely need it, the CRM requests log in on their own |

Everything in `@zoho-studio/zoho-crm` is imported from the package itself:

```ts
import { createFieldsRequest, getFieldsListRequest, getModulesListRequest } from '@zoho-studio/zoho-crm'
```

## Requests

A function that sends a request to Zoho ends with `Request`, so you can tell at a glance what
touches the CRM. It finds the project, adds the access token, and renews it when needed — a script
calls it like any function.

```ts
import { getFieldsListRequest, getModulesListRequest } from '@zoho-studio/zoho-crm'

const modules = await getModulesListRequest()
const custom = modules.filter((module) => module.generated_type === 'custom')

for (const module of custom) {
    const fields = await getFieldsListRequest(module.api_name)
    console.log(`${module.api_name}: ${fields.length} fields`)
}
```

The requests that exist, by entity:

| Entity | Requests |
|---|---|
| organization | `getOrganizationRequest` |
| modules | `getModulesListRequest`, `createModuleRequest` |
| fields | `getFieldsListRequest`, `getFieldsPageRequest`, `createFieldsRequest` |
| profiles | `getProfilesListRequest` |
| functions | `getFunctionsListRequest`, `getFunctionsPageRequest`, `getFunctionCodeRequest` |
| workflow rules | `getWorkflowRulesListRequest`, `getWorkflowRulesPageRequest`, `getWorkflowRuleRequest` |
| workflow actions | `getWorkflowActionsListRequest`, `getWorkflowActionsPageRequest`, `getWorkflowActionRequest` |
| webhooks | `getWebhooksListRequest`, `getWebhooksPageRequest`, `getWebhookRequest` |
| global picklists | `getGlobalPicklistsListRequest`, `getGlobalPicklistsPageRequest`, `getGlobalPicklistRequest` |
| client scripts | `getClientScriptPagesListRequest`, `getClientScriptsListRequest`, `getClientScriptSourceRequest` |
| static resources | `getStaticResourcesListRequest`, `getStaticResourceContentRequest` |

A `…ListRequest` returns every item, following Zoho's pages for you; a `…PageRequest` returns one
page. Your editor shows the parameters and the shape of the result for each.

**`createModuleRequest` and `createFieldsRequest` change the CRM** and nothing undoes a module.
For creating modules and fields, a [migration](7-migrations.md) is safer: it checks first and asks
before it sends.

### An endpoint without a ready request

`crmClient` sends any request to the CRM API with the project's login, relative to
`<api.baseUrl>/crm/<api.version>`:

```ts
import { crmClient } from '@zoho-studio/zoho-crm'

const { data } = await crmClient.get('/settings/layouts', { params: { module: 'Leads' } })
```

It is an [axios](https://axios-http.com) instance, so `get`, `post`, `put`, and `delete` work as
axios describes. When Zoho rejects a request, `describeRequestError(error)` turns the error into
Zoho's own message.

## Beyond requests

- **Pulls:** the same functions the commands run can be called from a script, for example to
  refresh one module's fields after changing them —
  `await pullFields({ module: 'Leads' }, silentPullProgress)`, with `silentPullProgress` from
  `@zoho-studio/core` when nothing should be printed.
- **The project:** `getProjectSettings()` from `@zoho-studio/core` returns the project folder and
  its settings.
- **Files:** `writeArtifactJson(projectPath, ['zoho-crm', 'reports', 'leads.json'], data)` from
  `@zoho-studio/core` writes under `data/`, with folder and file names made safe.

`scripts/example.ts` in a new project is a complete script to start from.
