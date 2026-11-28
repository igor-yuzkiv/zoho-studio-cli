import { describe, expect, test } from 'bun:test'

import { describeDataCenter } from '@/commands/zoho-crm/status/status.utils'

describe('describeDataCenter', () => {
    test('names the data center from the Zoho API address', () => {
        expect(describeDataCenter('https://www.zohoapis.eu')).toBe('eu (https://www.zohoapis.eu)')
        expect(describeDataCenter('https://www.zohoapis.com.au')).toBe('com.au (https://www.zohoapis.com.au)')
        expect(describeDataCenter('https://zohoapis.in')).toBe('in (https://zohoapis.in)')
    })

    test('prints any other address as it is', () => {
        expect(describeDataCenter('http://127.0.0.1:4000')).toBe('http://127.0.0.1:4000')
        expect(describeDataCenter('not a url')).toBe('not a url')
    })
})
