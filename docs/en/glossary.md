# Glossary

The words this documentation, the CLI messages, and the code use for the things the CLI works with.
Each term means one thing everywhere; when a page says "snapshot", it means exactly what is defined
here.

| Term | Meaning |
|---|---|
| **Artifact** | Any Zoho CRM object the CLI works with: a function, a module, a field, a workflow rule, and so on. |
| **Pull** | Downloading artifacts from Zoho CRM through the API, done by the `z-crm:*:pull` commands. Other tools call this a fetch. |
| **Snapshot** | The local copy of an artifact's state, as a pull downloaded it. Snapshots live under `data/zoho-crm/`. |

```text
Zoho CRM ── Pull ──> snapshots in data/zoho-crm/
```

A snapshot is the state of the CRM at the moment of the last pull, not a versioned history: the next
pull replaces it. Each pull command clears its folder before writing, so a change made by hand to a
snapshot is lost on the next pull of that artifact. Git is what keeps the history of snapshots, which
is why `data/` is meant to be committed — see [the project](user-guide/4-project.md#what-goes-into-git).
