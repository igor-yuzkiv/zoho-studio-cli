import { z } from 'zod'

import { baseFieldOptions, defineFieldType } from '../field-type.utils'

import type { DateFieldOptions } from './date-field.types'

export const dateField = defineFieldType<DateFieldOptions>()({
    optionsSchema: z.strictObject(baseFieldOptions),
    staticTextTooltip: false,
    toPayload: () => ({}),
})
