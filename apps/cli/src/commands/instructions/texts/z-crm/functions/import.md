# z-crm:functions:import

Copies a pulled function from `data/zoho-crm/functions/<api_name>/` into
`src/zoho-crm/functions/<api_name>/`: the code unchanged, and a `.deploy.json` with the CRM id, so
the first deploy updates that function instead of creating another.

- **Writes to Zoho:** no. **Writes locally:** `src/zoho-crm/functions/<api_name>/`. **Needs login:** no.

## When to use

To start changing an existing function. Always pass `<api_name>`: without it the command prompts,
and without a terminal it only prints the list of functions that can be imported.

## When it refuses

No snapshot in `data/` (pull first); the function is already in `src/`; not `Deluge 1.0` or not one
of the seven categories. A declaration Zoho would reject is imported with a warning.
