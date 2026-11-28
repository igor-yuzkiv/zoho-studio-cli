# z-crm:functions:deploy

Publishes `src/zoho-crm/functions/<api_name>/` to Zoho: creates the function when `id` in
`<api_name>.deploy.json` is `null` (and writes the new id back), updates it otherwise. Appends the
deployment to `deployments` in that file.

- **Writes to Zoho:** yes — the function goes live as soon as Zoho accepts it; there is no separate
  publish step and no undo. **Needs login:** yes.
- **Needs a terminal:** for the confirmation, unless `--yes` is given.

## When to use

When a change is ready and the person agreed to deploy it. Pass `--changelog "<what changed>"`.
Pass `--yes` only with that agreement.

## Before and after

- Local checks run first and nothing is sent when they fail: missing files, a name or category Zoho
  would refuse, a declaration that does not match `<category>.<display name>`.
- An update cannot change the API name, category or runtime.
- `DUPLICATE_DATA` — a function with that API name already exists: pull and import it, do not
  create another. `INVALID_DATA` — the stored id is gone in Zoho: set `id` to `null` to recreate.
- It does not pull afterwards; run `z-crm:functions:pull` to refresh `data/`.
