# z-crm:org:info

Reads the organization and stores the full record in `.zoho-studio/org.json`, printing the
readable fields (type — sandbox or production —, domain, currency, time zone, licence).

- **Writes to Zoho:** no. **Writes locally:** `.zoho-studio/org.json` (out of git). **Needs login:** yes.

## When to use

When you need details of the organization, above all whether it is a sandbox. `login` already runs
it once; the `pull-crm` preset runs it first. A failed run keeps the previous file.
