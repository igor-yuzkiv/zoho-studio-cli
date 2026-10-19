import { z } from 'zod'

import { baseFieldOptions, defineFieldType } from '../field-type.utils'

import type { PicklistFieldOptions } from './picklist-field.types'
import { findPicklistValueProblems, picklistValuesOption, toPicklistPayload } from './picklist-field.utils'

export const picklistField = defineFieldType<PicklistFieldOptions>()({
    optionsSchema: z.strictObject({ ...baseFieldOptions, ...picklistValuesOption }),
    staticTextTooltip: false,
    toPayload: (_label, { values }) => toPicklistPayload(values),
    findProblems: ({ values }) => findPicklistValueProblems(values),
})
