import { z } from 'zod'

import { baseFieldOptions, defineFieldType } from '../field-type.utils'

import type { LookupFieldOptions } from './lookup-field.types'

const moduleError = 'a lookup needs the API name of its target module.'

export const lookupField = defineFieldType<LookupFieldOptions>()({
    optionsSchema: z.strictObject({
        ...baseFieldOptions,
        module: z.string({ error: moduleError }).min(1, { error: moduleError }),
        display_label: z.string().optional(),
    }),
    staticTextTooltip: true,
    toPayload: (label, { module, display_label }) => ({
        lookup: { display_label: display_label ?? label, module: { api_name: module } },
    }),
})
