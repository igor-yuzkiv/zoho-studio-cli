# Pulling

Pulling downloads resources from the CRM into `data/zoho-crm/`. Each kind of resource has its own
command, and a **preset** runs several of them in a row.

**A pull mirrors the CRM in the folder it writes.** A file whose content did not change stays as it is; a changed one is rewritten, so local edits in those folders are overwritten — keep them in git. A file for something deleted in the CRM is not deleted: it moves to `data/.removed/<date-time>/`, under the same path it had in `data/`, and the pull prints a line `Moved N removed files to data/.removed/<date-time>/`. All the steps of one preset share one such folder. Nothing cleans `data/.removed/` up; delete what you no longer need. A project made by `init` keeps it out of git; in an older project, add `data/.removed/` to `.gitignore`.

Two cases keep older files where they are:

- A pull with `--module` (workflows, workflow actions) owns only that module's files and leaves the rest of the folder.
- A part that failed to download — a module's fields or layouts, a type of workflow actions — keeps its previous files.

A single item that failed within a part — the code of one function, say — keeps its previous file: Zoho still has the item, so nothing about it moves to `data/.removed/`.

## Everything at once

```bash
zoho-studio preset pull-crm
```

The built-in `pull-crm` preset runs every command below in the right order.

## One kind at a time

| Command | What it downloads | Where |
|---|---|---|
| `z-crm:org:info` | the organization | `.zoho-studio/org.json` |
| `z-crm:modules:pull` | modules | `data/zoho-crm/modules/<Module>/` |
| `z-crm:fields:pull` | fields of every downloaded module | `data/zoho-crm/modules/<Module>/fields/` |
| `z-crm:layouts:pull` | layouts of every downloaded module, with sections and formula expressions | `data/zoho-crm/modules/<Module>/layouts/` |
| `z-crm:functions:pull` | functions with their Deluge code | `data/zoho-crm/functions/` |
| `z-crm:workflows:pull` | workflow rules | `data/zoho-crm/workflows/` |
| `z-crm:workflow-actions:pull` | workflow actions | `data/zoho-crm/workflow-actions/` |
| `z-crm:webhooks:pull` | webhooks | `data/zoho-crm/webhooks/` |
| `z-crm:global-picklists:pull` | global picklists | `data/zoho-crm/global-picklists/` |
| `z-crm:profiles:pull` | profiles | `data/zoho-crm/profiles/` |
| `z-crm:client-scripts:pull` | client scripts | `data/zoho-crm/client-scripts/` |
| `z-crm:static-resources:pull` | static resources | `data/zoho-crm/static-resources/` |

Fields are pulled for the modules already downloaded, so run `z-crm:modules:pull` first. Some
commands take options, for example `zoho-studio z-crm:fields:pull --module=Leads` for one module;
each command's page in the [technical reference](../reference/README.md#documents) lists them.

Most commands download items one at a time. When one item fails — a single function, say — such a command reports it at the end, goes on with the rest, and exits with code 1 so a script or a preset can tell a partial pull from a clean one. `z-crm:modules:pull` and `z-crm:profiles:pull` fetch everything in one request, so an error there stops the command.

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

A preset stops at the first command that fails. More: [preset reference](../reference/project/preset.md).
