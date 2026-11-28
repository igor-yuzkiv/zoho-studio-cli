# z-crm:global-picklists:pull

Downloads every global picklist with its values, one JSON file per picklist named by its API name.

- **Writes to Zoho:** no. **Writes locally:** `data/zoho-crm/global-picklists/`. **Needs login:** yes.

## When to use

To see the shared picklist values. Which fields use a picklist is not pulled; field files from
`z-crm:fields:pull` hold their own picklist data.
