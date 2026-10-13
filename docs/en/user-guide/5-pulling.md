# Pulling

Pulling downloads resources from the CRM into `src/zoho-crm/`. Each kind of resource has its own
command, and a **preset** runs several of them in a row.

**A pull replaces the folder it writes.** What was deleted in the CRM disappears locally too, so
the files always mirror the CRM. Local edits in those folders are overwritten — keep them in git.

## Everything at once

```bash
zoho-studio preset pull-crm
```

The built-in `pull-crm` preset runs every command below in the right order.

## One kind at a time

| Command | What it downloads | Where |
|---|---|---|
| `z-crm:org:info` | the organization | `.zoho-studio/org.json` |
| `z-crm:modules:pull` | modules | `src/zoho-crm/modules/<Module>/` |
| `z-crm:fields:pull` | fields of every downloaded module | `src/zoho-crm/modules/<Module>/fields/` |
| `z-crm:functions:pull` | functions with their Deluge code | `src/zoho-crm/functions/` |
| `z-crm:workflows:pull` | workflow rules | `src/zoho-crm/workflows/` |
| `z-crm:workflow-actions:pull` | workflow actions | `src/zoho-crm/workflow-actions/` |
| `z-crm:webhooks:pull` | webhooks | `src/zoho-crm/webhooks/` |
| `z-crm:global-picklists:pull` | global picklists | `src/zoho-crm/global-picklists/` |
| `z-crm:profiles:pull` | profiles | `src/zoho-crm/profiles/` |
| `z-crm:client-scripts:pull` | client scripts | `src/zoho-crm/client-scripts/` |
| `z-crm:static-resources:pull` | static resources | `src/zoho-crm/static-resources/` |

Fields are pulled for the modules already downloaded, so run `z-crm:modules:pull` first. Some
commands take options, for example `zoho-studio z-crm:fields:pull --module=Leads` for one module;
each command's page in the [technical reference](../technical/1-overview.md#documents) lists them.

When one item fails — a single function, say — the command reports it at the end and goes on with
the rest.

## Presets

A preset is a named list of commands in `.zoho-studio/settings.json`:

```json
{
    "presets": {
        "pull-leads": ["z-crm:modules:pull", "z-crm:fields:pull --module=Leads"]
    }
}
```

```bash
zoho-studio preset              # list the presets
zoho-studio preset pull-leads   # run one
```

A preset stops at the first command that fails. More: [preset reference](../technical/24-preset-command.md).
