/** A module as Zoho returns it — the named fields are the ones the CLI relies on. */
export interface ZohoModule {
    id: string
    api_name: string
    module_name: string
    generated_type?: string
    [field: string]: unknown
}

/** The body of one module in a create request; Zoho generates `api_name` from `plural_label` when it is left out. */
export interface ZohoModuleCreate {
    singular_label: string
    plural_label: string
    api_name?: string
    profiles: { id: string }[]
    [property: string]: unknown
}
