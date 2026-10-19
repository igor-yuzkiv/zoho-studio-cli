import { z } from 'zod'

import { baseFieldOptions, defineFieldType } from '../field-type.utils'

import type { EmailFieldOptions } from './email-field.types'

export const emailField = defineFieldType<EmailFieldOptions>()({
    optionsSchema: z.strictObject(baseFieldOptions),
    staticTextTooltip: true,
    toPayload: () => ({}),
})
