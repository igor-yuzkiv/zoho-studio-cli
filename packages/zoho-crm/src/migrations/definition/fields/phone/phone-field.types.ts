import type { BaseFieldOptions } from '../field-type.types'

/** A phone number: `schema.phone('Mobile')`. */
export interface PhoneFieldOptions extends BaseFieldOptions {
    /** The most characters the field holds, 1 to 50000; Zoho's default when left out. */
    length?: number
}
