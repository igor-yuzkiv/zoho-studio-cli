import { z } from 'zod'

import { baseFieldOptions, defineFieldType, lengthOption } from '../field-type.utils'

import type { IntegerFieldOptions } from './integer-field.types'

export const integerField = defineFieldType<IntegerFieldOptions>()({
    optionsSchema: z.strictObject({ ...baseFieldOptions, ...lengthOption }),
    staticTextTooltip: true,
    toPayload: (_label, { length }) => ({ length }),
})
