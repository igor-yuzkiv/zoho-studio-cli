import type { BaseFieldOptions } from '../field-type.types'

/**
 * A text shown and stored as it is, or a pair that shows one text and stores another. Each stored
 * value has 1 to 25 characters and appears once.
 */
export type PicklistValue = string | { display_value: string; actual_value: string }

/**
 * One value from a list: `schema.picklist('Stage', { values: ['New', 'Active', 'Done'] })`. Zoho puts
 * `-None-` before the values.
 */
export interface PicklistFieldOptions extends BaseFieldOptions {
    /** At least one value, in the order the list shows them. */
    values: PicklistValue[]
}
