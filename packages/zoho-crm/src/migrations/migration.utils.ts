import type { ZohoFieldCreate } from '../entities/field'

import { declareFields } from './field-schema.builder'
import type { MigrationDefinition, MigrationDescription } from './migration.types'

const defaultProfiles = ['Administrator']
const maxModuleLabelLength = 50
const maxFieldLabelLength = 25
const maxPicklistValueLength = 25
const maxTextLength = 50000
const maxDecimalPlace = 9
const apiNamePattern = /^[A-Za-z](?:[A-Za-z0-9]|_(?!_))*(?<!_)$/
const apiNameRule = 'must start with a letter and hold only letters, digits and single underscores, not ending with one.'

/** Gives a migration file its types; the definition itself is returned unchanged. */
export function defineMigration(definition: MigrationDefinition): MigrationDefinition {
    return definition
}

/** Reduces a migration to the data a run sends. Validate it first: an invalid one is described as is. */
export function describeMigration(definition: MigrationDefinition): MigrationDescription {
    if (definition.create) {
        const { api_name, singular_label, plural_label, profiles, fields } = definition.create

        return {
            action: 'create',
            module: api_name === undefined ? { singular_label, plural_label } : { api_name, singular_label, plural_label },
            profiles: profiles ?? defaultProfiles,
            fields: declareFields(fields),
        }
    }

    return {
        action: 'update',
        module: { api_name: definition.update.module },
        fields: declareFields(definition.update.fields),
    }
}

/** Returns every problem of a migration that can be found without asking Zoho; an empty list means valid. */
export function validateMigration(definition: MigrationDefinition): string[] {
    if (!definition || Boolean(definition.create) === Boolean(definition.update)) {
        return ['A migration must declare exactly one action: create or update.']
    }

    let description: MigrationDescription

    try {
        description = describeMigration(definition)
    } catch (error) {
        return [`The fields declaration failed: ${error instanceof Error ? error.message : String(error)}`]
    }

    return [...validateModule(description), ...validateFields(description.fields)]
}

function validateModule(description: MigrationDescription): string[] {
    const problems: string[] = []

    if (description.action === 'update') {
        if (description.fields.length === 0) {
            problems.push('An update must add at least one field.')
        }

        return problems
    }

    const { api_name, singular_label, plural_label } = description.module

    if (api_name !== undefined && !apiNamePattern.test(api_name)) {
        problems.push(`Module API name "${api_name}" ${apiNameRule}`)
    }

    for (const [name, label] of [
        ['singular_label', singular_label],
        ['plural_label', plural_label],
    ] as const) {
        if (!isLengthBetween(label, 1, maxModuleLabelLength)) {
            problems.push(`Module ${name} must be 1 to ${maxModuleLabelLength} characters.`)
        }
    }

    return problems
}

function validateFields(fields: ZohoFieldCreate[]): string[] {
    const problems: string[] = []
    const seenLabels = new Set<string>()
    const seenApiNames = new Set<string>()

    for (const field of fields) {
        const report = (problem: string) => problems.push(`Field "${field.field_label}": ${problem}`)
        const label = field.field_label.toLowerCase()

        if (!isLengthBetween(field.field_label, 1, maxFieldLabelLength)) {
            report(`the label must be 1 to ${maxFieldLabelLength} characters.`)
        }

        if (seenLabels.has(label)) {
            report('the label is declared more than once.')
        }

        seenLabels.add(label)

        if (field.api_name !== undefined) {
            if (!apiNamePattern.test(field.api_name)) {
                report(`API name "${field.api_name}" ${apiNameRule}`)
            } else if (seenApiNames.has(field.api_name.toLowerCase())) {
                report(`API name "${field.api_name}" is declared more than once.`)
            }

            seenApiNames.add(field.api_name.toLowerCase())
        }

        validateTypeOptions(field, report)
    }

    return problems
}

function validateTypeOptions(field: ZohoFieldCreate, report: (problem: string) => void): void {
    if (field.length !== undefined && !isWholeNumberBetween(field.length, 1, maxTextLength)) {
        report(`length must be a whole number from 1 to ${maxTextLength}.`)
    }

    if (field.decimal_place !== undefined && !isWholeNumberBetween(field.decimal_place, 0, maxDecimalPlace)) {
        report(`decimal_place must be a whole number from 0 to ${maxDecimalPlace}.`)
    }

    if (Array.isArray(field.pick_list_values)) {
        validatePicklistValues(field.pick_list_values as { actual_value: string }[], report)
    }

    if (field.data_type === 'lookup' && !(field.lookup as { module: { api_name: string } }).module.api_name) {
        report('a lookup needs the API name of its target module.')
    }
}

function validatePicklistValues(values: { actual_value: string }[], report: (problem: string) => void): void {
    if (values.length === 0) {
        report('a picklist needs at least one value.')
    }

    const seenValues = new Set<string>()

    for (const { actual_value } of values) {
        if (seenValues.has(actual_value)) {
            report(`picklist value "${actual_value}" is declared more than once.`)
        }

        seenValues.add(actual_value)

        if (!isLengthBetween(actual_value, 1, maxPicklistValueLength)) {
            report(`picklist value "${actual_value}" must be 1 to ${maxPicklistValueLength} characters.`)
        }
    }
}

function isLengthBetween(value: string, min: number, max: number): boolean {
    return value.length >= min && value.length <= max
}

function isWholeNumberBetween(value: unknown, min: number, max: number): boolean {
    return Number.isInteger(value) && (value as number) >= min && (value as number) <= max
}
