/** A webhook action as Zoho returns it — the named fields are the ones the CLI relies on. */
export interface ZohoWebhook {
    id: string
    name: string
    module?: {
        api_name?: string
        [field: string]: unknown
    }
    [field: string]: unknown
}
