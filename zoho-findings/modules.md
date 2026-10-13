# Modules

## Labels with spaces and an API name with underscores are accepted

- **Observed:** 2026-10-13, sandbox org, probe for ZS-59
- **Spec says:** `singular_label`, `plural_label` and `api_name` match `^[a-zA-Z0-9]+$`, while the
  description allows spaces (modules.yaml:1250-1445)
- **Actually:** `POST /settings/modules` created `api_name: ZS_Probe` with labels `ZS Probe` /
  `ZS Probes`
- **In our code:** module labels are checked for length only; the API name allows single
  underscores

## Creating a module returns only its id

- **Observed:** 2026-10-13, sandbox org, probe for ZS-59
- **Spec says:** the same (modules.yaml:1521)
- **Actually:** `{ "modules": [{ "code": "SUCCESS", "details": { "id": "…" } }] }`; an API name
  Zoho generated has to be looked up by the id in `GET /settings/modules`
- **In our code:** the migration runner looks the module up by id when the migration gave no
  API name

## Fields can be added right after the module is created

- **Observed:** 2026-10-13, sandbox org, probe for ZS-59
- **Spec says:** not documented
- **Actually:** `POST /settings/fields?module=<new module>` succeeded on the first attempt, with no
  delay
- **In our code:** the runner creates fields immediately, without retries

## A new module comes with system fields

- **Observed:** 2026-10-13, sandbox org, probe for ZS-59
- **Spec says:** not documented beyond a default display field
- **Actually:** `Name` (`<Singular> Name`), `Owner` (`<Singular> Owner`), `Record_Image`
  (`<Singular> Image`), `Email`, `Secondary_Email`, `Email_Opt_Out`, `Created_By`, `Modified_By`,
  `Created_Time`, `Modified_Time`, `Last_Activity_Time`, `Tag`, `Currency`, `Exchange_Rate`,
  `Locked__s`, `Record_Status__s`, `Unsubscribed_Mode`, `Unsubscribed_Time`, `id`. **Assumed:**
  `Currency` and `Exchange_Rate` exist only with multi-currency enabled.
- **In our code:** migration checks treat these as taken in a `create`

## Modules cannot be deleted through the API

- **Observed:** 2026-10-13, spec review for ZS-59
- **Spec says:** v8 has no delete operation for modules
- **Actually:** probe modules had to be removed by hand in the CRM UI
- **In our code:** migrations never roll back; the docs warn to try them on a sandbox
