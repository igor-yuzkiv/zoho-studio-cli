# Organization

## The organization record names no data center

- **Observed:** 2026-11-28, sandbox org (EU), the `org.json` that `z-crm:org:info` stored
- **Spec says:** not checked against the spec
- **Actually:** `GET /org` returns `domain_name`, `alias`, `zgid`, `country_code`, `iso_code` and the rest, but no field that names the data center; the project's `api.baseUrl` (`https://www.zohoapis.eu`) is the only place it shows
- **In our code:** `z-crm:status` prints the data center from `api.baseUrl` (`status.utils.ts`)

## A sandbox has type `sandbox`; the production value is not known

- **Observed:** 2026-11-28, sandbox org (EU), the stored `org.json`
- **Spec says:** not checked against the spec
- **Actually:** a sandbox org has `"type": "sandbox"` and `"domain_name": "testigory"`, the same name as in its CRM address `https://crmsandbox.zoho.eu/crm/testigory/`
- **Assumed:** a production org has some other `type` value; which one was not seen
- **In our code:** `z-crm:status` prints `type` as Zoho returns it; the migration script and the agent instructions treat any value other than `sandbox` as production
