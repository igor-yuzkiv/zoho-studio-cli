import { describe, expect, test } from 'bun:test'

import { resolveContentSegments, resolveMetadataSegments } from '@/zoho-crm/entities/static-resource'

const billingDefault = { id: '42', name: 'billingDefault', file_name: 'billingDefault.js', source: 'user' }

describe('static resource segments', () => {
    test('places the file under its source and a directory named after the resource and its id', () => {
        expect(resolveContentSegments(billingDefault)).toEqual([
            'zoho-crm',
            'static-resources',
            'user',
            'billingDefault.42',
            'billingDefault.js',
        ])
    })

    test('keeps the metadata next to the file', () => {
        expect(resolveMetadataSegments(billingDefault).at(-1)).toBe('billingDefault.metadata.json')
    })
})
