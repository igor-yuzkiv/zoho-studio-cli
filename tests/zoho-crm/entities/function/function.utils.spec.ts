import { describe, expect, test } from 'bun:test'

import { resolveCodeSegments } from '@/zoho-crm/entities/function'

describe('resolveCodeSegments', () => {
    test('places the code in the function directory under the fixed extension', () => {
        expect(resolveCodeSegments({ api_name: 'calculate_total', name: 'Calculate Invoice Total' })).toEqual([
            'zoho-crm',
            'functions',
            'calculate_total',
            'Calculate Invoice Total.deluge',
        ])
    })

    test('keeps each name a single path segment', () => {
        expect(resolveCodeSegments({ api_name: 'crm/reports', name: 'reports/monthly' })).toEqual([
            'zoho-crm',
            'functions',
            'crm_reports',
            'reports_monthly.deluge',
        ])
    })
})
