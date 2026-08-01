import { describe, expect, test } from 'bun:test'

import { resolveCodeSegments } from '@/entities/function'

describe('resolveCodeSegments', () => {
    test('places the code in the function directory under the fixed extension', () => {
        expect(resolveCodeSegments({ api_name: 'calculate_total', name: 'Calculate Invoice Total' })).toEqual([
            'functions',
            'calculate_total',
            'Calculate Invoice Total.deluge',
        ])
    })

    test('keeps each name a single path segment', () => {
        expect(resolveCodeSegments({ api_name: 'crm/reports', name: 'reports/monthly' })).toEqual([
            'functions',
            'crm_reports',
            'reports_monthly.deluge',
        ])
    })
})
