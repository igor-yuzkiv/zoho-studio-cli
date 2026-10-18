# `zoho-studio z-crm:functions:import`

Copies a function already pulled into `data/zoho-crm/functions/` into `src/zoho-crm/functions/`, so
you can start working on an existing function straight away. It asks nothing, works without a
terminal and without a login, and sends nothing to Zoho.

```bash
zoho-studio z-crm:functions:import oz_wf_refresh_pricing
```

```text
Created src/zoho-crm/functions/oz_wf_refresh_pricing/oz_wf_refresh_pricing.deluge
Created src/zoho-crm/functions/oz_wf_refresh_pricing/oz_wf_refresh_pricing.deploy.json
```

`<api_name>` is the function's folder in `data/zoho-crm/functions/` — its API name. Leave it out to
pick the function from a list of pulled functions that are not in `src/` yet: type a few letters to
narrow it down by API name or display name. Without a terminal the list is printed instead, and
nothing is imported. The same import is
offered by [`zoho-studio z-crm:functions:make`](29-functions-make-command.md) when the API name you
enter there has a snapshot.

## What it writes

The snapshot's code is copied unchanged into `<api_name>.deluge`, and `<api_name>.deploy.json` is
written from the snapshot's metadata — with the function's CRM `id`, so the first
[`z-crm:functions:deploy`](30-functions-deploy-command.md) updates that function instead of creating
another:

```json
{
    "id": "6640142000053695173",
    "name": "Refresh Pricing",
    "api_name": "oz_wf_refresh_pricing",
    "description": "Recalculates",
    "runtime": "Deluge 1.0",
    "category": "Automation",
    "deployments": []
}
```

The snapshot in `data/` is left as it is. If the code does not declare `<category>.<display name>`
the way Zoho expects, the files are still written and the command prints a warning that a deploy will
be rejected until the declaration is fixed.

## When it refuses

Nothing is written, and the command exits with code 1, when:

- there is no snapshot of the function in `data/` — pull functions first;
- `src/zoho-crm/functions/` already has the function, under the same API name in any case;
- the function does not run on `Deluge 1.0`, or its category is not one of the seven Deluge
  categories;
- the snapshot has no code, or holds more than one function record — pull functions again;
- `src/zoho-crm/functions/` still holds pulled functions from before they moved to `data/` — move them
  with `mv src/zoho-crm data/zoho-crm`.
