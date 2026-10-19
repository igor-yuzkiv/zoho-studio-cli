import type { BaseFieldOptions } from '../field-type.types'

/** A percentage: `schema.percent('Discount', { decimal_place: 1 })`. */
export interface PercentFieldOptions extends BaseFieldOptions {
    /** Digits after the decimal point, 0 to 9; Zoho's default when left out. */
    decimal_place?: number
}
