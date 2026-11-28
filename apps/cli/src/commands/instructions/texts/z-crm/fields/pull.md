# z-crm:fields:pull

Downloads the fields of every locally pulled module into `<Module>/fields/`, one JSON file per field named by its API name.

- **Writes to Zoho:** no. **Writes locally:** `data/zoho-crm/modules/<Module>/fields/`. **Needs login:** yes.

## When to use

To see the fields of a module: types, picklist values, lookups. Formula expressions are not here —
they come with `z-crm:layouts:pull`. `--module=<api_name>` refreshes one module.

## Side effects

Run `z-crm:modules:pull` first, or there is nothing to walk. A module that fails keeps its previous
`fields/` and is listed in the summary; the run exits 1.
