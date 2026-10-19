import { z } from 'zod'

import { baseFieldOptions, defineFieldType } from '../field-type.utils'

import type { BooleanFieldOptions } from './boolean-field.types'

export const booleanField = defineFieldType<BooleanFieldOptions>()({
    optionsSchema: z.strictObject(baseFieldOptions),
    staticTextTooltip: false,
    toPayload: () => ({}),
})
