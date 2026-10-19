import type { BaseFieldOptions } from '../field-type.types'

/** A link to a record of another module: `schema.lookup('Account', { module: 'Accounts' })`. */
export interface LookupFieldOptions extends BaseFieldOptions {
    /** API name of the module the field points at; it must already exist in the organization. */
    module: string
    /** The label of the related list on the target module; the field label when left out. */
    display_label?: string
}
