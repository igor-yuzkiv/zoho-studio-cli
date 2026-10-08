/** A global picklist as Zoho returns it — the named fields are the ones the CLI relies on. */
export interface ZohoGlobalPicklist {
    id: string
    api_name: string
    display_label?: string
    pick_list_values?: ZohoGlobalPicklistValue[]
    [field: string]: unknown
}

export interface ZohoGlobalPicklistValue {
    id: string
    actual_value?: string
    display_value?: string
    sequence_number?: number
    [field: string]: unknown
}
