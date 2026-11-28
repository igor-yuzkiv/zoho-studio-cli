# z-crm:profiles:pull

Downloads every profile, one JSON file per profile named by its API name, with the permissions the list carries.

- **Writes to Zoho:** no. **Writes locally:** `data/zoho-crm/profiles/`. **Needs login:** yes.

## When to use

To check profile names before a migration (`profiles` in a `create` migration) or to review
permissions.
