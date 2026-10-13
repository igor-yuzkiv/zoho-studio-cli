import { describe, expect, test } from 'bun:test'

import { staticResourceContentFilePath, staticResourceMetadataFilePath } from '@zoho-studio/zoho-crm/static-resource'

const pricingHelpers = { id: '42', name: 'pricingHelpers', file_name: 'pricingHelpers.js', source: 'user' }

describe('static resource segments', () => {
    test('places the file under its source and a directory named after the resource and its id', () => {
        expect(staticResourceContentFilePath(pricingHelpers)).toEqual([
            'zoho-crm',
            'static-resources',
            'user',
            'pricingHelpers.42',
            'pricingHelpers.js',
        ])
    })

    test('keeps the metadata next to the file', () => {
        expect(staticResourceMetadataFilePath(pricingHelpers).at(-1)).toBe('pricingHelpers.metadata.json')
    })
})
