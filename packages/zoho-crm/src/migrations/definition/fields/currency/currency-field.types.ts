import type { BaseFieldOptions } from '../field-type.types'

/** An amount of money: `schema.currency('Budget', { decimal_place: 2 })`. */
export interface CurrencyFieldOptions extends BaseFieldOptions {
    /** The most digits the field holds, 1 to 50000; Zoho's default when left out. */
    length?: number
    /** Digits after the decimal point, 0 to 9; Zoho's default when left out. */
    decimal_place?: number
    /** How amounts are rounded; Zoho's default when left out. */
    rounding_option?: 'normal' | 'round_off' | 'round_up' | 'round_down'
    /** Digits kept when rounding, 0 to 9; Zoho's default when left out. */
    precision?: number
}
