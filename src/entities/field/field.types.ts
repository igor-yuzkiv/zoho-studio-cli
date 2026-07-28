/** A module field as Zoho returns it — the named fields are the ones the CLI relies on. */
export interface ZohoField {
    id: string
    api_name: string
    field_label: string
    data_type: string
    [field: string]: unknown
}
