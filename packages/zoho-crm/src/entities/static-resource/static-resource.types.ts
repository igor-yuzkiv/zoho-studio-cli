/** A static resource as Zoho returns it — the named fields are the ones the CLI relies on. */
export interface StaticResource {
    id: string
    name: string
    file_name: string
    source: string
    uri?: string | null
    [field: string]: unknown
}
