import type { ZohoField } from '../field'

/** A field as a layout section lists it; a formula field carries its `formula.expression` only here. */
export type ZohoLayoutField = ZohoField

export interface ZohoLayoutSection {
    api_name: string
    display_label?: string
    fields?: ZohoLayoutField[]
    [property: string]: unknown
}

/** A module layout as Zoho returns it — the named fields are the ones the CLI relies on. */
export interface ZohoLayout {
    id: string
    api_name: string
    name?: string
    sections?: ZohoLayoutSection[]
    [property: string]: unknown
}
