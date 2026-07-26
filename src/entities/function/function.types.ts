/** A function as Zoho returns it — the named fields are the ones the CLI relies on. */
export interface ZohoFunction {
    id: string
    name: string
    api_name: string
    category?: string
    [field: string]: unknown
}
