import { describe, expect, test } from 'bun:test'

import { sortGlobalPicklists } from '@/entities/global-picklist'

describe('sortGlobalPicklists', () => {
    test('orders by API name, then id so collisions resolve the same way each run', () => {
        const globalPicklists = [
            { id: '9', api_name: 'Source' },
            { id: '3', api_name: 'Industry' },
            { id: '1', api_name: 'Industry' },
        ]

        expect(sortGlobalPicklists(globalPicklists).map((picklist) => picklist.id)).toEqual(['1', '3', '9'])
    })

    test('leaves the given list untouched', () => {
        const globalPicklists = [
            { id: '2', api_name: 'Source' },
            { id: '1', api_name: 'Industry' },
        ]

        sortGlobalPicklists(globalPicklists)

        expect(globalPicklists.map((picklist) => picklist.id)).toEqual(['2', '1'])
    })
})
