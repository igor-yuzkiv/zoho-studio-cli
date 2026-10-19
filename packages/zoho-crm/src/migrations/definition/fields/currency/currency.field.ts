import { z } from 'zod'

import {
    baseFieldOptions,
    decimalPlaceOption,
    defineFieldType,
    lengthOption,
    precisionOption,
} from '../field-type.utils'

import type { CurrencyFieldOptions } from './currency-field.types'

export const currencyField = defineFieldType<CurrencyFieldOptions>()({
    optionsSchema: z.strictObject({
        ...baseFieldOptions,
        ...lengthOption,
        ...decimalPlaceOption,
        rounding_option: z
            .enum(['normal', 'round_off', 'round_up', 'round_down'], {
                error: 'rounding_option must be normal, round_off, round_up, or round_down.',
            })
            .optional(),
        ...precisionOption,
    }),
    staticTextTooltip: true,
    toPayload: (_label, { length, decimal_place, rounding_option, precision }) => {
        const rounding = Object.fromEntries(
            Object.entries({ rounding_option, precision }).filter(([, value]) => value !== undefined)
        )

        return { length, decimal_place, currency: Object.keys(rounding).length > 0 ? rounding : undefined }
    },
})
