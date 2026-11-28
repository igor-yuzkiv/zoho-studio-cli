# @zoho-studio/zoho-crm

Zoho CRM for zoho-studio projects: the API client, a request function per endpoint the CLI uses, the names of the folders under `data/zoho-crm/`, migrations, and widget testing. Everything is exported from the root, so a script needs one import.

## Reads by default

`crmClient` refuses every request that can change the organization — any `POST`, `PUT`, `PATCH`, or `DELETE` other than `POST /coql` — with `CrmWritesDisabledError` (`code: 'CRM_WRITES_DISABLED'`), and sends nothing. A script that is meant to write calls `allowCrmWrites()` first; the CLI's own commands do so for themselves. A script that only reads is safe to run against any organization.

## Entry points

- `crmClient` — an axios instance for `<api.baseUrl>/crm/<api.version>` of the project, with the token already set. Use it for an endpoint that has no request function: `crmClient.get('/Leads', { params: { fields: 'Last_Name' } })`.
- Request functions end with `Request` — each sends one request: `getOrganizationRequest()`, `getModulesListRequest()`, `getFieldsListRequest(module)`, `getLayoutsListRequest(module)`, `getFunctionsListRequest()`, `getFunctionCodeRequest(id)`, `getWorkflowRulesListRequest()`, and the others in `src/entities/*/api/`.
- Folder names: `zohoCrmDirName`, `modulesDirName`, `fieldsDirName`, `layoutsDirName`, `functionsDirName`, … (`src/zoho-crm.config.ts`) — combine them with `resolveArtifactPath` from `@zoho-studio/core`.
- `allowCrmWrites()`, `disallowCrmWrites()` — turn writes on and back off.
- `describeRequestError(error)` — Zoho's own message for a rejected request, instead of the HTTP status.
- `runMigrationScript()` — the whole `bun run migrate` (`scripts/migrate.ts`).
- `@zoho-studio/zoho-crm/widget-testing` — Playwright fixtures for widgets; see `zoho-studio instructions z-crm:widgets`.

Each entity is also a subpath with its types: `@zoho-studio/zoho-crm/field`, `/module`, `/function`, `/layout`, `/organization`, … (`exports` in `package.json`). The shapes of the answers are in `src/entities/<entity>/<entity>.types.ts`.

## Example: ask Zoho, read only

```ts
import { getFieldsListRequest, getOrganizationRequest } from '@zoho-studio/zoho-crm'

const organization = await getOrganizationRequest()
const fields = await getFieldsListRequest('Leads')

console.log(`${organization.company_name}: Leads has ${fields.length} fields`)
```

## Example: a COQL query

```ts
import { crmClient, describeRequestError } from '@zoho-studio/zoho-crm'

try {
    const { data } = await crmClient.post('/coql', { select_query: "select Last_Name from Leads where Lead_Status = 'Contacted' limit 10" })
    console.log(data.data ?? [])
} catch (error) {
    console.error(describeRequestError(error))
    process.exitCode = 1
}
```

## Example: a script that writes

```ts
import { allowCrmWrites, crmClient, getOrganizationRequest } from '@zoho-studio/zoho-crm'

const organization = await getOrganizationRequest()
console.log(`Writing to ${organization.company_name} (${organization.type})`)

allowCrmWrites()
await crmClient.put('/Leads', { data: [{ id: '3000000040016', Lead_Status: 'Contacted' }] })
```

Run a script from the project folder: `bun run scripts/<name>.ts`.
