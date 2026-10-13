import type { ZohoFieldCreate } from '../../entities/field'

import type {
    FieldOptions,
    FieldsDeclaration,
    FieldSchema,
    FieldTooltip,
    PicklistValue,
} from './migration-definition.types'

/** Runs a fields declaration and returns the create payload of every field it declared, in order. */
export function declareFields(declaration: FieldsDeclaration): ZohoFieldCreate[] {
    const fields: ZohoFieldCreate[] = []

    const add = (label: string, dataType: string, options: FieldOptions, properties: object = {}) => {
        fields.push(
            withoutUndefined({
                field_label: label,
                api_name: options.api_name,
                data_type: dataType,
                tooltip: options.tooltip === undefined ? undefined : toZohoTooltip(options.tooltip),
                ...properties,
            })
        )
    }

    const schema: FieldSchema = {
        text: (label, options = {}) => add(label, 'text', options, { length: options.length }),
        // Zoho refuses a textarea without a size, so the smallest one stands in for "not named".
        textarea: (label, options = {}) =>
            add(label, 'textarea', options, { textarea: { type: options.size ?? 'small' } }),
        email: (label, options = {}) => add(label, 'email', options),
        phone: (label, options = {}) => add(label, 'phone', options, { length: options.length }),
        website: (label, options = {}) => add(label, 'website', options),
        integer: (label, options = {}) => add(label, 'integer', options, { length: options.length }),
        bigint: (label, options = {}) => add(label, 'bigint', options, { length: options.length }),
        double: (label, options = {}) =>
            add(label, 'double', options, { length: options.length, decimal_place: options.decimal_place }),
        percent: (label, options = {}) =>
            add(label, 'percent', options, { decimal_place: options.decimal_place }),
        currency: (label, options = {}) => {
            const rounding = withoutUndefined({ rounding_option: options.rounding_option, precision: options.precision })

            add(label, 'currency', options, {
                length: options.length,
                decimal_place: options.decimal_place,
                currency: Object.keys(rounding).length > 0 ? rounding : undefined,
            })
        },
        date: (label, options = {}) => add(label, 'date', options),
        datetime: (label, options = {}) => add(label, 'datetime', options),
        boolean: (label, options = {}) => add(label, 'boolean', options),
        picklist: (label, options) =>
            add(label, 'picklist', options, { pick_list_values: options.values.map(toPicklistValue) }),
        multiselectpicklist: (label, options) =>
            add(label, 'multiselectpicklist', options, {
                pick_list_values: options.values.map(toPicklistValue),
            }),
        lookup: (label, options) =>
            add(label, 'lookup', options, {
                lookup: { display_label: options.display_label ?? label, module: { api_name: options.module } },
            }),
        userlookup: (label, options = {}) => add(label, 'userlookup', options),
    }

    declaration(schema)

    return fields
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
