import type { BaseFieldOptions } from '../field-type.types'

/** A number with a fractional part: `schema.double('Weight', { decimal_place: 3 })`. */
export interface DoubleFieldOptions extends BaseFieldOptions {
    /** The most digits the field holds, 1 to 50000; Zoho's default when left out. */
    length?: number
    /** Digits after the decimal point, 0 to 9; Zoho's default when left out. */
    decimal_place?: number
}
