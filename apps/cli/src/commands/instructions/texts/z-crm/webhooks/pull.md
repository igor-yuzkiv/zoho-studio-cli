# z-crm:webhooks:pull

Downloads every webhook with its URL, method, body, headers, URL parameters and authentication (the connection name, no secrets), one JSON file per webhook.

- **Writes to Zoho:** no. **Writes locally:** `data/zoho-crm/webhooks/`. **Needs login:** yes.

## When to use

To see what a webhook sends. Which rules use a webhook is not pulled; the rule files list the
webhooks they invoke. No `--module` option.
