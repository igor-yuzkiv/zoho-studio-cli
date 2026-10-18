# Glossary

The words this documentation, the CLI messages, and the code use for the things the CLI works with.
Each term means one thing everywhere; when a page says "snapshot", it means exactly what is defined
here.

| Term | Meaning |
|---|---|
| **Artifact** | Any Zoho CRM object the CLI works with: a function, a module, a field, a workflow rule, and so on. |
| **Pull** | Downloading artifacts from Zoho CRM through the API, done by the `z-crm:*:pull` commands. Other tools call this a fetch. |
| **Snapshot** | The local copy of an artifact's state, as a pull downloaded it. Snapshots live under `data/zoho-crm/`. |
| **Source** | Code and metadata of an artifact developed locally. Source lives under `src/zoho-crm/`, and no pull touches it. |
| **Import** | Copying an artifact from its snapshot into source to develop it locally, done by `z-crm:functions:import` and offered by `z-crm:functions:make`. |
| **Deploy** | Creating or updating an artifact in Zoho CRM from its source, done by `z-crm:functions:deploy`. |
| **Deployment** | One deploy that Zoho accepted, with its date and operation (create or update). |
| **Changelog** | The description of the change a deployment brought. |
| **Deployment History** | The local list of successful deployments, kept in the function's `<api_name>.deploy.json`. |
| **Scaffold** | Creating the first files of a new artifact from a template, done by `z-crm:functions:make`. |

```text
Zoho CRM ── Pull ──> data/ (snapshots)
                         │
                       Import          Scaffold
                         │                │
                         v                v
                       src/ (source) <────┘
                         │
                       Deploy
                         │
                         v
                      Zoho CRM
```

A snapshot is the state of the CRM at the moment of the last pull, not a versioned history: the next
pull replaces it, and a pull never touches source. A deploy does not pull either. Each pull command clears its folder before writing, so a change made by hand to a
snapshot is lost on the next pull of that artifact. Git is what keeps the history of snapshots, which
is why `data/` is meant to be committed — see [the project](user-guide/4-project.md#what-goes-into-git).
