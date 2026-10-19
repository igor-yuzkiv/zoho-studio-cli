import { z } from 'zod'

import { baseFieldOptions, decimalPlaceOption, defineFieldType, lengthOption } from '../field-type.utils'

import type { DoubleFieldOptions } from './double-field.types'

export const doubleField = defineFieldType<DoubleFieldOptions>()({
    optionsSchema: z.strictObject({ ...baseFieldOptions, ...lengthOption, ...decimalPlaceOption }),
    staticTextTooltip: true,
    toPayload: (_label, { length, decimal_place }) => ({ length, decimal_place }),
})
