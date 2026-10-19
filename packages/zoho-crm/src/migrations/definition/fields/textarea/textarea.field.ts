import { z } from 'zod'

import { baseFieldOptions, defineFieldType } from '../field-type.utils'

import type { TextareaFieldOptions } from './textarea-field.types'

// Zoho refuses a textarea without a size, so the smallest one stands in for "not named".
export const textareaField = defineFieldType<TextareaFieldOptions>()({
    optionsSchema: z.strictObject({
        ...baseFieldOptions,
        size: z.enum(['small', 'large', 'rich_text'], { error: 'size must be small, large, or rich_text.' }).optional(),
    }),
    // Untested on Zoho: the first probe failed for a missing size before the tooltip was checked.
    staticTextTooltip: false,
    toPayload: (_label, { size }) => ({ textarea: { type: size ?? 'small' } }),
})
