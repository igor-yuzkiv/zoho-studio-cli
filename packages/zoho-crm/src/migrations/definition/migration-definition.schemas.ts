import { z } from 'zod'

const maxModuleLabelLength = 50
const maxFieldLabelLength = 25
const maxPicklistValueLength = 25
const maxLength = 50000
const maxDecimalPlace = 9
const maxTooltipLength = 255
const maxStaticTextTooltipLength = 35
const apiNamePattern = /^[A-Za-z](?:[A-Za-z0-9]|_(?!_))*(?<!_)$/
const apiNameRule = 'must start with a letter and hold only letters, digits and single underscores, not ending with one.'

/** Seen accepted on a sandbox org; the rest answered DEPENDENT_MISMATCH, and textarea is untested. */
const staticTextTooltipTypes = new Set([
    'text',
    'email',
    'phone',
    'website',
    'integer',
    'bigint',
    'double',
    'percent',
    'currency',
    'lookup',
])

const wholeNumber = (name: string, min: number, max: number) => {
    const error = `${name} must be a whole number from ${min} to ${max}.`

    return z.int({ error }).min(min, { error }).max(max, { error })
}

const apiName = (subject: string) =>
    z.string({ error: `${subject} must be a string.` }).regex(apiNamePattern, {
        error: (issue) => `${subject} "${String(issue.input)}" ${apiNameRule}`,
    })

export const tooltipSchema = z.union(
    [z.string(), z.strictObject({ type: z.enum(['static_text', 'info_icon']), text: z.string() })],
    { error: "tooltip must be a text, or { type: 'static_text' | 'info_icon', text }." }
)

export const picklistValueSchema = z.union([z.string(), z.strictObject({ display_value: z.string(), actual_value: z.string() })])

const baseOptions = {
    api_name: apiName('API name').optional(),
    tooltip: tooltipSchema.optional(),
}

const lengthOption = { length: wholeNumber('length', 1, maxLength).optional() }
const decimalOption = { decimal_place: wholeNumber('decimal_place', 0, maxDecimalPlace).optional() }

const picklistOptions = {
    values: z
        .array(picklistValueSchema, {
            error: 'values must be a list of strings or { display_value, actual_value } pairs.',
        })
        .min(1, { error: 'a picklist needs at least one value.' }),
}

/** The options of every field type; `z.strictObject` turns a misspelt option into an error. */
export const fieldOptionSchemas = {
    text: z.strictObject({ ...baseOptions, ...lengthOption }),
    textarea: z.strictObject({
        ...baseOptions,
        size: z.enum(['small', 'large', 'rich_text'], { error: 'size must be small, large, or rich_text.' }).optional(),
    }),
    email: z.strictObject(baseOptions),
    phone: z.strictObject({ ...baseOptions, ...lengthOption }),
    website: z.strictObject(baseOptions),
    integer: z.strictObject({ ...baseOptions, ...lengthOption }),
    bigint: z.strictObject({ ...baseOptions, ...lengthOption }),
    double: z.strictObject({ ...baseOptions, ...lengthOption, ...decimalOption }),
    percent: z.strictObject({ ...baseOptions, ...decimalOption }),
    currency: z.strictObject({
        ...baseOptions,
        ...lengthOption,
        ...decimalOption,
        rounding_option: z
            .enum(['normal', 'round_off', 'round_up', 'round_down'], {
                error: 'rounding_option must be normal, round_off, round_up, or round_down.',
            })
            .optional(),
        precision: wholeNumber('precision', 0, maxDecimalPlace).optional(),
    }),
    date: z.strictObject(baseOptions),
    datetime: z.strictObject(baseOptions),
    boolean: z.strictObject(baseOptions),
    picklist: z.strictObject({ ...baseOptions, ...picklistOptions }),
    multiselectpicklist: z.strictObject({ ...baseOptions, ...picklistOptions }),
    lookup: z.strictObject({
        ...baseOptions,
        module: z
            .string({ error: 'a lookup needs the API name of its target module.' })
            .min(1, { error: 'a lookup needs the API name of its target module.' }),
        display_label: z.string().optional(),
    }),
    userlookup: z.strictObject(baseOptions),
}

export type FieldDataType = keyof typeof fieldOptionSchemas

export const fieldLabelSchema = z
    .string({ error: `the label must be 1 to ${maxFieldLabelLength} characters.` })
    .min(1, { error: `the label must be 1 to ${maxFieldLabelLength} characters.` })
    .max(maxFieldLabelLength, { error: `the label must be 1 to ${maxFieldLabelLength} characters.` })

/** Rules that depend on the field type or compare values, checked once the options have their shape. */
export function findFieldRuleProblems(dataType: FieldDataType, options: Record<string, unknown>): string[] {
    const problems: string[] = []
    const tooltip = options.tooltip as z.infer<typeof tooltipSchema> | undefined

    if (typeof tooltip === 'object' && tooltip.type === 'static_text') {
        if (!staticTextTooltipTypes.has(dataType)) {
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

    const values = options.values as z.infer<typeof picklistValueSchema>[] | undefined
    const seenValues = new Set<string>()

    for (const value of values ?? []) {
        const actualValue = typeof value === 'string' ? value : value.actual_value

        if (seenValues.has(actualValue)) {
            problems.push(`picklist value "${actualValue}" is declared more than once.`)
        }

        seenValues.add(actualValue)

        if (!isLengthBetween(actualValue, 1, maxPicklistValueLength)) {
            problems.push(`picklist value "${actualValue}" must be 1 to ${maxPicklistValueLength} characters.`)
        }
    }

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
    api_name: apiName('Module API name').optional(),
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
 * above; only an unknown option gets its wording here, since Zod's names the key without context.
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
