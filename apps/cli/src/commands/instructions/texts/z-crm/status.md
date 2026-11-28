# z-crm:status

Asks Zoho which organization the project is connected to and prints its name, id, type, domain
(the organization's part of its CRM web address), data center (taken from `api.baseUrl` in the
settings, as the record has none), and primary email. A type of `sandbox` is a sandbox; treat
any other value as production. Refreshes the access token on the way, so success also proves
the refresh token works.

- **Writes to Zoho:** no. **Writes locally:** nothing. **Needs login:** yes.

## When to use

First thing in a session, and before any command that writes to the organization. "This project is
not authorized yet" means the person has to run `zoho-studio login`. `--json` prints the full org
record.
