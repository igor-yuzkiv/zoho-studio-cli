import type { BaseFieldOptions } from '../field-type.types'

/** Several lines of text: `schema.textarea('Notes', { size: 'large' })`. */
export interface TextareaFieldOptions extends BaseFieldOptions {
    /** `small` when left out: Zoho refuses a textarea without a size. */
    size?: 'small' | 'large' | 'rich_text'
}
