import { z } from 'zod'

import { baseFieldOptions, defineFieldType, lengthOption } from '../field-type.utils'

import type { PhoneFieldOptions } from './phone-field.types'

export const phoneField = defineFieldType<PhoneFieldOptions>()({
    optionsSchema: z.strictObject({ ...baseFieldOptions, ...lengthOption }),
    staticTextTooltip: true,
    toPayload: (_label, { length }) => ({ length }),
})
