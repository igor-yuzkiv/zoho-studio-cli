import { z } from 'zod'

import { baseFieldOptions, defineFieldType, lengthOption } from '../field-type.utils'

import type { BigintFieldOptions } from './bigint-field.types'

export const bigintField = defineFieldType<BigintFieldOptions>()({
    optionsSchema: z.strictObject({ ...baseFieldOptions, ...lengthOption }),
    staticTextTooltip: true,
    toPayload: (_label, { length }) => ({ length }),
})
