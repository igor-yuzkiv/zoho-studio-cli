import type { ZohoFieldCreate } from '../../entities/field'

import { fieldOptionSchemas, type FieldDataType } from './migration-definition.schemas'
import type {
    CurrencyOptions,
    FieldDeclaration,
    FieldsDeclaration,
    FieldSchema,
    FieldTooltip,
    LookupOptions,
    PicklistOptions,
    PicklistValue,
    TextareaOptions,
} from './migration-definition.types'

/** Runs a fields declaration and records every call as written, for validation before any payload. */
export function collectFieldDeclarations(declaration: FieldsDeclaration): FieldDeclaration[] {
    const declarations: FieldDeclaration[] = []
    const schema = Object.fromEntries(
        (Object.keys(fieldOptionSchemas) as FieldDataType[]).map((dataType) => [
            dataType,
            (label: string, options: Record<string, unknown> = {}) => declarations.push({ label, dataType, options }),
        ])
    ) as unknown as FieldSchema

    declaration(schema)

    return declarations
}

/** Runs a fields declaration and returns the create payload of every field it declared, in order. */
export function declareFields(declaration: FieldsDeclaration): ZohoFieldCreate[] {
    return collectFieldDeclarations(declaration).map(toFieldPayload)
}

/** Assumes a validated declaration: the options are the ones its type allows. */
export function toFieldPayload({ label, dataType, options }: FieldDeclaration): ZohoFieldCreate {
    const tooltip = options.tooltip as FieldTooltip | undefined

    return withoutUndefined({
        field_label: label,
        api_name: options.api_name as string | undefined,
        data_type: dataType,
        tooltip: tooltip === undefined ? undefined : toZohoTooltip(tooltip),
        ...typeProperties(dataType, label, options),
    })
}

function typeProperties(dataType: FieldDataType, label: string, options: Record<string, unknown>): object {
    switch (dataType) {
        case 'text':
        case 'phone':
        case 'integer':
        case 'bigint':
            return { length: options.length }
        case 'textarea':
            // Zoho refuses a textarea without a size, so the smallest one stands in for "not named".
            return { textarea: { type: (options as TextareaOptions).size ?? 'small' } }
        case 'double':
            return { length: options.length, decimal_place: options.decimal_place }
        case 'percent':
            return { decimal_place: options.decimal_place }
        case 'currency': {
            const { length, decimal_place, rounding_option, precision } = options as CurrencyOptions
            const rounding = withoutUndefined({ rounding_option, precision })

            return { length, decimal_place, currency: Object.keys(rounding).length > 0 ? rounding : undefined }
        }
        case 'picklist':
        case 'multiselectpicklist':
            return { pick_list_values: (options as PicklistOptions).values.map(toPicklistValue) }
        case 'lookup': {
            const { module, display_label } = options as LookupOptions

            return { lookup: { display_label: display_label ?? label, module: { api_name: module } } }
        }
        default:
            return {}
    }
}

function toPicklistValue(value: PicklistValue): { display_value: string; actual_value: string } {
    return typeof value === 'string' ? { display_value: value, actual_value: value } : value
}

function toZohoTooltip(tooltip: FieldTooltip): { name: string; value: string } {
    return typeof tooltip === 'string'
        ? { name: 'info_icon', value: tooltip }
        : { name: tooltip.type, value: tooltip.text }
}

function withoutUndefined<T extends object>(value: T): T {
    return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined)) as T
}
