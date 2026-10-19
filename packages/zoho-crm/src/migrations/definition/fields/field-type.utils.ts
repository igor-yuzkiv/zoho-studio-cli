import { z } from 'zod'

import type { BaseFieldOptions, FieldTypeDefinition } from './field-type.types'

const maxLength = 50000
const maxDecimalPlace = 9
const apiNamePattern = /^[A-Za-z](?:[A-Za-z0-9]|_(?!_))*(?<!_)$/
const apiNameRule =
    'must start with a letter and hold only letters, digits and single underscores, not ending with one.'

type SameType<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false

/**
 * Declares a field type against its documented options: the build fails unless the schema accepts
 * exactly `Options` — no option missing, none extra, no type different.
 */
export function defineFieldType<Options extends BaseFieldOptions>() {
    return <Schema extends z.ZodType>(
        definition: Omit<FieldTypeDefinition<Options>, 'optionsSchema'> & {
            optionsSchema: Schema &
                (SameType<z.input<Schema>, Options> extends true ? unknown : 'does not match the options type')
        }
    ): FieldTypeDefinition<Options> => definition as unknown as FieldTypeDefinition<Options>
}

export const wholeNumber = (name: string, min: number, max: number) => {
    const error = `${name} must be a whole number from ${min} to ${max}.`

    return z.int({ error }).min(min, { error }).max(max, { error })
}

export const apiNameSchema = (subject: string) =>
    z.string({ error: `${subject} must be a string.` }).regex(apiNamePattern, {
        error: (issue) => `${subject} "${String(issue.input)}" ${apiNameRule}`,
    })

export const tooltipSchema = z.union(
    [z.string(), z.strictObject({ type: z.enum(['static_text', 'info_icon']), text: z.string() })],
    { error: "tooltip must be a text, or { type: 'static_text' | 'info_icon', text }." }
)

export const baseFieldOptions = {
    api_name: apiNameSchema('API name').optional(),
    tooltip: tooltipSchema.optional(),
}

export const lengthOption = { length: wholeNumber('length', 1, maxLength).optional() }
export const decimalPlaceOption = { decimal_place: wholeNumber('decimal_place', 0, maxDecimalPlace).optional() }
export const precisionOption = { precision: wholeNumber('precision', 0, maxDecimalPlace).optional() }
