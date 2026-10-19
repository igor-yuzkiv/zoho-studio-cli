import { z } from 'zod'

import { bigintField } from './fields/bigint'
import { booleanField } from './fields/boolean'
import { currencyField } from './fields/currency'
import { dateField } from './fields/date'
import { datetimeField } from './fields/datetime'
import { doubleField } from './fields/double'
import { emailField } from './fields/email'
import { integerField } from './fields/integer'
import { lookupField } from './fields/lookup'
import { multiselectpicklistField } from './fields/multiselectpicklist'
import { percentField } from './fields/percent'
import { phoneField } from './fields/phone'
import { picklistField } from './fields/picklist'
import { textareaField } from './fields/textarea'
import { textField } from './fields/text'
import { userlookupField } from './fields/userlookup'
import { websiteField } from './fields/website'
import type { FieldTooltip, FieldTypeDefinition } from './fields'
import { apiNameSchema } from './fields/field-type.utils'

const maxModuleLabelLength = 50
const maxFieldLabelLength = 25
const maxTooltipLength = 255
const maxStaticTextTooltipLength = 35

/**
 * Every field type a migration can declare, keyed by Zoho's `data_type`. `schema.<type>()`, its
 * options, and the validation all come from here, so a new type is a folder in fields/ and a line
 * below. The comment on each entry is what an editor shows for `schema.<type>`.
 */
export const fieldTypes = {
    /** A single line of text: `schema.text('Code', { length: 50 })`. */
    text: textField,
    /** Several lines of text: `schema.textarea('Notes', { size: 'large' })`. */
    textarea: textareaField,
    /** An email address: `schema.email('Billing Email')`. */
    email: emailField,
    /** A phone number: `schema.phone('Mobile')`. */
    phone: phoneField,
    /** A URL: `schema.website('Portal')`. */
    website: websiteField,
    /** A whole number: `schema.integer('Seats')`. */
    integer: integerField,
    /** A whole number too long for `integer`: `schema.bigint('External ID')`. */
    bigint: bigintField,
    /** A number with a fractional part: `schema.double('Weight', { decimal_place: 3 })`. */
    double: doubleField,
    /** A percentage: `schema.percent('Discount', { decimal_place: 1 })`. */
    percent: percentField,
    /** An amount of money: `schema.currency('Budget', { decimal_place: 2 })`. */
    currency: currencyField,
    /** A date without time: `schema.date('Deadline')`. */
    date: dateField,
    /** A date with time: `schema.datetime('Starts At')`. */
    datetime: datetimeField,
    /** A checkbox: `schema.boolean('Archived')`. */
    boolean: booleanField,
    /** One value from a list: `schema.picklist('Stage', { values: ['New', 'Active', 'Done'] })`. */
    picklist: picklistField,
    /** Several values from a list: `schema.multiselectpicklist('Channels', { values: ['Email', 'Phone'] })`. */
    multiselectpicklist: multiselectpicklistField,
    /** A link to a record of another module: `schema.lookup('Account', { module: 'Accounts' })`. */
    lookup: lookupField,
    /** A link to a CRM user: `schema.userlookup('Reviewer')`. */
    userlookup: userlookupField,
}

export type FieldDataType = keyof typeof fieldTypes

/** Looks a type up for code that handles any field; its options are known only after validation. */
export function fieldTypeOf(dataType: FieldDataType): FieldTypeDefinition<Record<string, unknown>> {
    return fieldTypes[dataType] as unknown as FieldTypeDefinition<Record<string, unknown>>
}

export const fieldLabelSchema = z
    .string({ error: `the label must be 1 to ${maxFieldLabelLength} characters.` })
    .min(1, { error: `the label must be 1 to ${maxFieldLabelLength} characters.` })
    .max(maxFieldLabelLength, { error: `the label must be 1 to ${maxFieldLabelLength} characters.` })

/** Rules that depend on the field type or compare values, checked once the options have their shape. */
export function findFieldRuleProblems(dataType: FieldDataType, options: Record<string, unknown>): string[] {
    const problems: string[] = []
    const fieldType = fieldTypeOf(dataType)
    const tooltip = options.tooltip as FieldTooltip | undefined

    if (typeof tooltip === 'object' && tooltip.type === 'static_text') {
        if (!fieldType.staticTextTooltip) {
            problems.push(
                `a static_text tooltip is not supported for ${dataType} fields; give the text alone for an info icon.`
            )
        } else if (!isLengthBetween(tooltip.text, 1, maxStaticTextTooltipLength)) {
            problems.push(`a static_text tooltip must be 1 to ${maxStaticTextTooltipLength} characters.`)
        }
    } else if (tooltip !== undefined) {
        const text = typeof tooltip === 'string' ? tooltip : tooltip.text

        if (!isLengthBetween(text, 1, maxTooltipLength)) {
            problems.push(`the tooltip must be 1 to ${maxTooltipLength} characters.`)
        }
    }

    problems.push(...(fieldType.findProblems?.(options) ?? []))

    return problems
}

const moduleLabel = (name: string) => {
    const error = `Module ${name} must be 1 to ${maxModuleLabelLength} characters.`

    return z.string({ error }).min(1, { error }).max(maxModuleLabelLength, { error })
}

const fieldsDeclarationSchema = (action: string) =>
    z.custom<(schema: never) => void>((value) => typeof value === 'function', {
        error: `${action}: fields must be a function that declares the fields.`,
    })

export const createModuleSchema = z.strictObject({
    api_name: apiNameSchema('Module API name').optional(),
    singular_label: moduleLabel('singular_label'),
    plural_label: moduleLabel('plural_label'),
    profiles: z.array(z.string(), { error: 'create: profiles must be a list of profile names.' }).optional(),
    fields: fieldsDeclarationSchema('create'),
})

export const updateModuleSchema = z.strictObject({
    module: z
        .string({ error: 'update: module must be the API name of an existing module.' })
        .min(1, { error: 'update: module must be the API name of an existing module.' }),
    fields: fieldsDeclarationSchema('update'),
})

/**
 * Turns Zod issues into the problem lines a migration reports. Every message is written in full
 * where its schema is declared; only an unknown option gets its wording here, since Zod's names the key without context.
 */
export function describeIssues(issues: z.core.$ZodIssue[], subject: { all?: string; unknownOption: string }): string[] {
    return issues.map((issue) =>
        issue.code === 'unrecognized_keys'
            ? `${subject.unknownOption}unknown option${issue.keys.length > 1 ? 's' : ''} ${issue.keys
                  .map((key) => `"${key}"`)
                  .join(', ')}.`
            : `${subject.all ?? ''}${issue.message}`
    )
}

function isLengthBetween(value: string, min: number, max: number): boolean {
    return value.length >= min && value.length <= max
}
