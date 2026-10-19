import { z } from 'zod'

import { baseFieldOptions, defineFieldType } from '../field-type.utils'

import type { DatetimeFieldOptions } from './datetime-field.types'

export const datetimeField = defineFieldType<DatetimeFieldOptions>()({
    optionsSchema: z.strictObject(baseFieldOptions),
    staticTextTooltip: false,
    toPayload: () => ({}),
})
