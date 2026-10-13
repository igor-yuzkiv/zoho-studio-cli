import { describe, expect, test } from 'bun:test'

import { declareFields } from '@zoho-studio/zoho-crm/migrations'

const values = ['New', 'Active', 'Done'].map((value) => ({ display_value: value, actual_value: value }))

describe('declareFields', () => {
    test('turns every supported type into the payload Zoho accepted on the sandbox org', () => {
        const fields = declareFields((schema) => {
            schema.text('P Text', { api_name: 'P_Text', length: 100 })
            schema.textarea('P Textarea', { api_name: 'P_Textarea', size: 'large' })
            schema.email('P Email', { api_name: 'P_Email' })
            schema.phone('P Phone', { api_name: 'P_Phone', length: 30 })
            schema.website('P Website', { api_name: 'P_Website' })
            schema.integer('P Integer', { api_name: 'P_Integer', length: 9 })
            schema.bigint('P Bigint', { api_name: 'P_Bigint' })
            schema.double('P Double', { api_name: 'P_Double', length: 16, decimal_place: 2 })
            schema.percent('P Percent', { api_name: 'P_Percent', decimal_place: 2 })
            schema.currency('P Currency', {
                api_name: 'P_Currency',
                decimal_place: 2,
                rounding_option: 'normal',
                precision: 2,
            })
            schema.date('P Date', { api_name: 'P_Date' })
            schema.datetime('P Datetime', { api_name: 'P_Datetime' })
            schema.boolean('P Boolean', { api_name: 'P_Boolean' })
            schema.picklist('P Picklist', { api_name: 'P_Picklist', values: ['New', 'Active', 'Done'] })
            schema.multiselectpicklist('P Multiselect', { api_name: 'P_Multiselect', values })
            schema.lookup('P Lookup', { api_name: 'P_Lookup', module: 'Accounts', display_label: 'Probe Lookups' })
            schema.userlookup('P User', { api_name: 'P_User' })
        })

        expect(fields).toEqual([
            { field_label: 'P Text', api_name: 'P_Text', data_type: 'text', length: 100 },
            { field_label: 'P Textarea', api_name: 'P_Textarea', data_type: 'textarea', textarea: { type: 'large' } },
            { field_label: 'P Email', api_name: 'P_Email', data_type: 'email' },
            { field_label: 'P Phone', api_name: 'P_Phone', data_type: 'phone', length: 30 },
            { field_label: 'P Website', api_name: 'P_Website', data_type: 'website' },
            { field_label: 'P Integer', api_name: 'P_Integer', data_type: 'integer', length: 9 },
            { field_label: 'P Bigint', api_name: 'P_Bigint', data_type: 'bigint' },
            { field_label: 'P Double', api_name: 'P_Double', data_type: 'double', length: 16, decimal_place: 2 },
            { field_label: 'P Percent', api_name: 'P_Percent', data_type: 'percent', decimal_place: 2 },
            {
                field_label: 'P Currency',
                api_name: 'P_Currency',
                data_type: 'currency',
                decimal_place: 2,
                currency: { rounding_option: 'normal', precision: 2 },
            },
            { field_label: 'P Date', api_name: 'P_Date', data_type: 'date' },
            { field_label: 'P Datetime', api_name: 'P_Datetime', data_type: 'datetime' },
            { field_label: 'P Boolean', api_name: 'P_Boolean', data_type: 'boolean' },
            { field_label: 'P Picklist', api_name: 'P_Picklist', data_type: 'picklist', pick_list_values: values },
            {
                field_label: 'P Multiselect',
                api_name: 'P_Multiselect',
                data_type: 'multiselectpicklist',
                pick_list_values: values,
            },
            {
                field_label: 'P Lookup',
                api_name: 'P_Lookup',
                data_type: 'lookup',
                lookup: { display_label: 'Probe Lookups', module: { api_name: 'Accounts' } },
            },
            { field_label: 'P User', api_name: 'P_User', data_type: 'userlookup' },
        ])
    })

    test('leaves out options that were not given, so Zoho applies its own defaults', () => {
        expect(declareFields((schema) => schema.text('Code'))).toEqual([{ field_label: 'Code', data_type: 'text' }])
    })

    test('labels the related list of a lookup after the field when no label is given', () => {
        expect(declareFields((schema) => schema.lookup('Account', { module: 'Accounts' }))).toEqual([
            {
                field_label: 'Account',
                data_type: 'lookup',
                lookup: { display_label: 'Account', module: { api_name: 'Accounts' } },
            },
        ])
    })

    test('turns a tooltip text into an info icon, and keeps an explicit tooltip type', () => {
        const fields = declareFields((schema) => {
            schema.text('Code', { tooltip: 'Internal project code' })
            schema.date('Deadline', { tooltip: { type: 'static_text', text: 'Last working day' } })
        })

        expect(fields.map((field) => field.tooltip)).toEqual([
            { name: 'info_icon', value: 'Internal project code' },
            { name: 'static_text', value: 'Last working day' },
        ])
    })

    test('gives a textarea the small size when none is named, since Zoho refuses one without a size', () => {
        expect(declareFields((schema) => schema.textarea('Notes'))).toEqual([
            { field_label: 'Notes', data_type: 'textarea', textarea: { type: 'small' } },
        ])
    })
})
