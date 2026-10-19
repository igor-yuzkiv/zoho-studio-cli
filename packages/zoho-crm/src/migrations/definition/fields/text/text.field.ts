import { z } from 'zod'

import { baseFieldOptions, defineFieldType, lengthOption } from '../field-type.utils'

import type { TextFieldOptions } from './text-field.types'

export const textField = defineFieldType<TextFieldOptions>()({
    optionsSchema: z.strictObject({ ...baseFieldOptions, ...lengthOption }),
    staticTextTooltip: true,
    toPayload: (_label, { length }) => ({ length }),
})
