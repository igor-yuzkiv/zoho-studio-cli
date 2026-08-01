import { describe, expect, test } from 'bun:test'

import { resolveFieldFileName } from '@/commands/fields/pull-fields.command'

describe('resolveFieldFileName', () => {
    test('names the file after the field API name', () => {
        expect(resolveFieldFileName('Last_Name')).toBe('Last_Name.json')
    })

    test('keeps the file name a single path segment', () => {
        expect(resolveFieldFileName('reports/monthly')).toBe('reports_monthly.json')
    })
})
