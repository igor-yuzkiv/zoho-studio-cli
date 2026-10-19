import { z } from 'zod'

import { baseFieldOptions, defineFieldType } from '../field-type.utils'

import type { WebsiteFieldOptions } from './website-field.types'

export const websiteField = defineFieldType<WebsiteFieldOptions>()({
    optionsSchema: z.strictObject(baseFieldOptions),
    staticTextTooltip: true,
    toPayload: () => ({}),
})
