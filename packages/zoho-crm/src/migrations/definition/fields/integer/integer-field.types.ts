import type { BaseFieldOptions } from '../field-type.types'

/** A whole number: `schema.integer('Seats')`. */
export interface IntegerFieldOptions extends BaseFieldOptions {
    /** The most digits the field holds, 1 to 50000; Zoho's default when left out. */
    length?: number
}
