# z-crm:client-scripts:pull

Downloads every client script with its JavaScript source as the author wrote it, in folders by module (`_no-module/` for commands), page, and script name with id.

- **Writes to Zoho:** no. **Writes locally:** `data/zoho-crm/client-scripts/`. **Needs login:** yes.

## When to use

To read or review client scripts. The CLI cannot deploy them: changes go through the Zoho UI.

## Side effects

The source is fetched from the script's hosting URL without the OAuth token, as the CRM web UI does.
A script that fails keeps what could be written and is listed in the summary.
