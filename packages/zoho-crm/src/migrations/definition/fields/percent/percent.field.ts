import { z } from 'zod'

import { baseFieldOptions, decimalPlaceOption, defineFieldType } from '../field-type.utils'

import type { PercentFieldOptions } from './percent-field.types'

export const percentField = defineFieldType<PercentFieldOptions>()({
    optionsSchema: z.strictObject({ ...baseFieldOptions, ...decimalPlaceOption }),
    staticTextTooltip: true,
    toPayload: (_label, { decimal_place }) => ({ decimal_place }),
})
