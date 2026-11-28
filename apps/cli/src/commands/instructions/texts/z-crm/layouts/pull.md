# z-crm:layouts:pull

Downloads the layouts of every locally pulled module into `<Module>/layouts/`, one JSON file per layout, with sections and the fields in each — including formula expressions, which Zoho returns only here.

- **Writes to Zoho:** no. **Writes locally:** `data/zoho-crm/modules/<Module>/layouts/`. **Needs login:** yes.

## When to use

To see what a record page shows, or a formula field's expression. `--module=<api_name>` refreshes
one module.

## Side effects

Run `z-crm:modules:pull` first, or there is nothing to walk. A module that fails keeps its previous
`layouts/`.
