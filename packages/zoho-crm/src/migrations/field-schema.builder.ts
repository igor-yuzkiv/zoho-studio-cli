import type { ZohoFieldCreate } from '../entities/field'

import type { FieldsDeclaration, FieldSchema, PicklistValue } from './migration.types'

/** Runs a fields declaration and returns the create payload of every field it declared, in order. */
export function declareFields(declaration: FieldsDeclaration): ZohoFieldCreate[] {
    const fields: ZohoFieldCreate[] = []

    const add = (label: string, dataType: string, apiName: string | undefined, properties: object = {}) => {
        fields.push(withoutUndefined({ field_label: label, api_name: apiName, data_type: dataType, ...properties }))
    }

    const schema: FieldSchema = {
        text: (label, options = {}) => add(label, 'text', options.api_name, { length: options.length }),
        textarea: (label, options = {}) =>
            add(label, 'textarea', options.api_name, { textarea: options.size && { type: options.size } }),
        email: (label, options = {}) => add(label, 'email', options.api_name),
        phone: (label, options = {}) => add(label, 'phone', options.api_name, { length: options.length }),
        website: (label, options = {}) => add(label, 'website', options.api_name),
        integer: (label, options = {}) => add(label, 'integer', options.api_name, { length: options.length }),
        bigint: (label, options = {}) => add(label, 'bigint', options.api_name, { length: options.length }),
        double: (label, options = {}) =>
            add(label, 'double', options.api_name, { length: options.length, decimal_place: options.decimal_place }),
        percent: (label, options = {}) =>
            add(label, 'percent', options.api_name, { decimal_place: options.decimal_place }),
        currency: (label, options = {}) => {
            const rounding = withoutUndefined({ rounding_option: options.rounding_option, precision: options.precision })

            add(label, 'currency', options.api_name, {
                length: options.length,
                decimal_place: options.decimal_place,
                currency: Object.keys(rounding).length > 0 ? rounding : undefined,
            })
        },
        date: (label, options = {}) => add(label, 'date', options.api_name),
        datetime: (label, options = {}) => add(label, 'datetime', options.api_name),
        boolean: (label, options = {}) => add(label, 'boolean', options.api_name),
        picklist: (label, options) =>
            add(label, 'picklist', options.api_name, { pick_list_values: options.values.map(toPicklistValue) }),
        multiselectpicklist: (label, options) =>
            add(label, 'multiselectpicklist', options.api_name, {
                pick_list_values: options.values.map(toPicklistValue),
            }),
        lookup: (label, options) =>
            add(label, 'lookup', options.api_name, {
                lookup: { display_label: options.display_label ?? label, module: { api_name: options.module } },
            }),
        userlookup: (label, options = {}) => add(label, 'userlookup', options.api_name),
    }

    declaration(schema)

    return fields
}

function toPicklistValue(value: PicklistValue): { display_value: string; actual_value: string } {
    return typeof value === 'string' ? { display_value: value, actual_value: value } : value
}

function withoutUndefined<T extends object>(value: T): T {
    return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined)) as T
}
