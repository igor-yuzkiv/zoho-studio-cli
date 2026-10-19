import { z } from 'zod'

import { baseFieldOptions, defineFieldType } from '../field-type.utils'
import { findPicklistValueProblems, picklistValuesOption, toPicklistPayload } from '../picklist'

import type { MultiselectpicklistFieldOptions } from './multiselectpicklist-field.types'

export const multiselectpicklistField = defineFieldType<MultiselectpicklistFieldOptions>()({
    optionsSchema: z.strictObject({ ...baseFieldOptions, ...picklistValuesOption }),
    staticTextTooltip: false,
    toPayload: (_label, { values }) => toPicklistPayload(values),
    findProblems: ({ values }) => findPicklistValueProblems(values),
})
