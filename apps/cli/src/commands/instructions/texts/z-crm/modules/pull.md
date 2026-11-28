# z-crm:modules:pull

Downloads the metadata of every CRM module, one folder per module named by its API name, holding `<Module>.metadata.json`.

- **Writes to Zoho:** no. **Writes locally:** `data/zoho-crm/modules/`. **Needs login:** yes.

## When to use

Before `z-crm:fields:pull` and `z-crm:layouts:pull`, which walk the local module folders, and
whenever modules were added or removed in Zoho.

## Side effects

It owns only the metadata files. A module removed in Zoho moves to `data/.removed/` with its whole
folder, fields and layouts included. One request: a failure is fatal and leaves the folder as it was.
