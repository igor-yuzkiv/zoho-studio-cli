/** A module as Zoho returns it — the named fields are the ones the CLI relies on. */
export interface ZohoModule {
    id: string
    api_name: string
    module_name: string
    generated_type?: string
    [field: string]: unknown
}
