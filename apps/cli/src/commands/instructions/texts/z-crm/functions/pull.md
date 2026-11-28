# z-crm:functions:pull

Downloads every CRM function into `data/zoho-crm/functions/<api_name>/`: the full metadata record
and the Deluge source, verbatim.

- **Writes to Zoho:** no. **Writes locally:** `data/zoho-crm/functions/`. **Needs login:** yes.

## When to use

Before reading, importing or running a function from `data/`, and after a deploy to see what Zoho
stores (it drops leading tabs and the trailing newline, so the snapshot never matches `src/` byte
for byte).

## Side effects

Code is fetched one function at a time; a function whose code fails keeps its metadata and is
listed in the summary. A function removed in Zoho moves to `data/.removed/`. `src/` is not touched.
