/** A profile as Zoho returns it — the named fields are the ones the CLI relies on. */
export interface ZohoProfile {
    id: string
    api_name: string
    name: string
    [field: string]: unknown
}
