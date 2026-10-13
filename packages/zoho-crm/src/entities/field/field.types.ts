/** A module field as Zoho returns it — the named fields are the ones the CLI relies on. */
export interface ZohoField {
    id: string
    api_name: string
    field_label: string
    data_type: string
    [field: string]: unknown
}

/** The body of one field in a create request; the properties allowed beside the two required ones depend on `data_type`. */
export interface ZohoFieldCreate {
    field_label: string
    data_type: string
    api_name?: string
    [property: string]: unknown
}

export type FieldCreateResult =
    | { status: 'success'; id: string }
    | { status: 'error'; code: string; message: string }
