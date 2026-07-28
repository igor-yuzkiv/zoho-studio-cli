import { describe, expect, test } from 'bun:test'

import { assertModuleName, resolveFieldFileName } from '@/commands/fields/pull-fields.command'

describe('assertModuleName', () => {
    test('accepts a plain module API name', () => {
        expect(assertModuleName('Leads')).toBe('Leads')
        expect(assertModuleName('CustomModule1')).toBe('CustomModule1')
    })

    test('rejects a value that is not a single path segment', () => {
        expect(() => assertModuleName('')).toThrow(/must be a module API name/)
        expect(() => assertModuleName('.')).toThrow(/must be a module API name/)
        expect(() => assertModuleName('..')).toThrow(/must be a module API name/)
        expect(() => assertModuleName('../Leads')).toThrow(/must be a module API name/)
        expect(() => assertModuleName('crm/Leads')).toThrow(/must be a module API name/)
        expect(() => assertModuleName('crm\\Leads')).toThrow(/must be a module API name/)
    })
})

describe('resolveFieldFileName', () => {
    test('names the file after the field API name', () => {
        expect(resolveFieldFileName('Last_Name')).toBe('Last_Name.json')
    })

    test('keeps the file name a single path segment', () => {
        expect(resolveFieldFileName('reports/monthly')).toBe('reports_monthly.json')
    })
})
