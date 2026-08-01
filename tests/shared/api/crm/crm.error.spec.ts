import { describe, expect, test } from 'bun:test'

import { describeRequestError } from '@/shared/api/crm'

describe('describeRequestError', () => {
    test('prefers what Zoho put in the response body over the HTTP status', () => {
        const error = Object.assign(new Error('Request failed with status code 400'), {
            response: { data: { message: 'The value provided to the param is Invalid', code: 'INVALID_MODULE' } },
        })

        expect(describeRequestError(error)).toBe('The value provided to the param is Invalid (INVALID_MODULE)')
    })

    test('falls back to the error message when there is no Zoho payload', () => {
        expect(describeRequestError(new Error('socket hang up'))).toBe('socket hang up')
        expect(describeRequestError('broken')).toBe('broken')
    })
})
