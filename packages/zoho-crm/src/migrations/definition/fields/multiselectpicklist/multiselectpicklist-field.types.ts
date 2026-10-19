import type { BaseFieldOptions } from '../field-type.types'
import type { PicklistValue } from '../picklist'

/** Several values from a list: `schema.multiselectpicklist('Channels', { values: ['Email', 'Phone'] })`. */
export interface MultiselectpicklistFieldOptions extends BaseFieldOptions {
    /** At least one value, in the order the list shows them. */
    values: PicklistValue[]
}
