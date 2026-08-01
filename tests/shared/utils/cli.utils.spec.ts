import { describe, expect, test } from 'bun:test'

import { assertModuleName } from '@/shared/utils'

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
