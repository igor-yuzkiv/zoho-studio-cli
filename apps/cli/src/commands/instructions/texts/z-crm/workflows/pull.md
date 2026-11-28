# z-crm:workflows:pull

Downloads every workflow rule, one JSON file per rule, with its criteria, instant and scheduled actions. Actions appear as references (name, id, type) — their bodies come from `z-crm:workflow-actions:pull` and `z-crm:webhooks:pull`.

- **Writes to Zoho:** no. **Writes locally:** `data/zoho-crm/workflows/`. **Needs login:** yes.

## When to use

To find what fires on a module and when. `--module=<api_name>` refreshes the rules of one module and
leaves the others. Rule names are not unique: a duplicate carries its id in the file name.
