import type { BaseFieldOptions } from '../field-type.types'

/** A single line of text: `schema.text('Code', { length: 50 })`. */
export interface TextFieldOptions extends BaseFieldOptions {
    /** The most characters the field holds, 1 to 50000; Zoho's default when left out. */
    length?: number
}
