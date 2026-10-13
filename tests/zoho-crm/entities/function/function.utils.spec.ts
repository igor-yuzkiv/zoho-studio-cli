import { describe, expect, test } from 'bun:test'

import { functionCodeFilePath } from '@zoho-studio/zoho-crm/function'

describe('functionCodeFilePath', () => {
    test('places the code in the function directory under the fixed extension', () => {
        expect(functionCodeFilePath({ api_name: 'calculate_total', name: 'Calculate Invoice Total' })).toEqual([
            'zoho-crm',
            'functions',
            'calculate_total',
            'Calculate Invoice Total.deluge',
        ])
    })

    test('keeps each name a single path segment', () => {
        expect(functionCodeFilePath({ api_name: 'crm/reports', name: 'reports/monthly' })).toEqual([
            'zoho-crm',
            'functions',
            'crm_reports',
            'reports_monthly.deluge',
        ])
    })
})
