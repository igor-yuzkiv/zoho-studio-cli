# z-crm:status

Asks Zoho which organization the project is connected to and prints its name, id and primary
email. Refreshes the access token on the way, so success also proves the refresh token works.

- **Writes to Zoho:** no. **Writes locally:** nothing. **Needs login:** yes.

## When to use

First thing in a session, and before any command that writes to the organization. "This project is
not authorized yet" means the person has to run `zoho-studio login`. `--json` prints the full org
record.
