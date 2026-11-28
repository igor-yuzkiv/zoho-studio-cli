# z-crm:static-resources:pull

Downloads every static resource — the JS files client scripts load — with its file, in folders by source: `user` (uploaded in this organization), `crm` and `internal` (shipped by Zoho).

- **Writes to Zoho:** no. **Writes locally:** `data/zoho-crm/static-resources/`. **Needs login:** yes.

## When to use

To read the libraries client scripts depend on. Usually only `user/` is of interest. The CLI cannot
upload them.

## Side effects

Files are written byte for byte; Zoho's gzip resources stay gzip.
