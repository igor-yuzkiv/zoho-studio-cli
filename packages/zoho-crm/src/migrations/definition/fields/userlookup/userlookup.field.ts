import { z } from 'zod'

import { baseFieldOptions, defineFieldType } from '../field-type.utils'

import type { UserlookupFieldOptions } from './userlookup-field.types'

export const userlookupField = defineFieldType<UserlookupFieldOptions>()({
    optionsSchema: z.strictObject(baseFieldOptions),
    staticTextTooltip: false,
    toPayload: () => ({}),
})
