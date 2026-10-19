import type { BaseFieldOptions } from '../field-type.types'

/** A whole number too long for `integer`: `schema.bigint('External ID')`. */
export interface BigintFieldOptions extends BaseFieldOptions {
    /** The most digits the field holds, 1 to 50000; Zoho's default when left out. */
    length?: number
}
