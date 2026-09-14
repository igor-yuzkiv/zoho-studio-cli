/** A milestone as Zoho Projects returns it (`phase` in the API) — the named fields are the ones the CLI relies on. */
export interface ZohoMilestone {
    id: string
    name: string
    [field: string]: unknown
}
