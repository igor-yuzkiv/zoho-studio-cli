import { z } from 'zod'

import type { PicklistValue } from './picklist-field.types'

const maxPicklistValueLength = 25

const picklistValueSchema = z.union([
    z.string(),
    z.strictObject({ display_value: z.string(), actual_value: z.string() }),
])

/** Shared by picklist and multiselectpicklist, which take their values the same way. */
export const picklistValuesOption = {
    values: z
        .array(picklistValueSchema, {
            error: 'values must be a list of strings or { display_value, actual_value } pairs.',
        })
        .min(1, { error: 'a picklist needs at least one value.' }),
}

export function findPicklistValueProblems(values: PicklistValue[]): string[] {
    const problems: string[] = []
    const seenValues = new Set<string>()

    for (const value of values) {
        const actualValue = typeof value === 'string' ? value : value.actual_value

        if (seenValues.has(actualValue)) {
            problems.push(`picklist value "${actualValue}" is declared more than once.`)
        }

        seenValues.add(actualValue)

        if (actualValue.length < 1 || actualValue.length > maxPicklistValueLength) {
            problems.push(`picklist value "${actualValue}" must be 1 to ${maxPicklistValueLength} characters.`)
        }
    }

    return problems
}

export function toPicklistPayload(values: PicklistValue[]): { pick_list_values: object[] } {
    return {
        pick_list_values: values.map((value) =>
            typeof value === 'string' ? { display_value: value, actual_value: value } : value
        ),
    }
}
