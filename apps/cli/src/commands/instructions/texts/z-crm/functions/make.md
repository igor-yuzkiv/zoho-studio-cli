# z-crm:functions:make

Scaffolds a new Deluge function in `src/zoho-crm/functions/<api_name>/` through questions —
category, module, purpose, API name, display name, description — with a stub that compiles as is.
Offers an import when the API name belongs to a pulled function.

- **Writes to Zoho:** no. **Writes locally:** `src/zoho-crm/functions/<api_name>/`. **Needs login:** no.
- **Needs a terminal:** yes — without one it stops. An agent cannot run it; ask the person.

## When to use

For a new function. The proposed API name follows `zohoCrm.functions.naming` in the settings:
`<vendor>_<category prefix>_<module>_<purpose>`. Arguments are not asked for; add them to the
declaration in the `.deluge` file. For an existing function use `z-crm:functions:import`.
