import { afterAll, afterEach, beforeEach, describe, expect, test } from 'bun:test'

import { allowCrmWrites, crmClient, CrmWritesDisabledError, disallowCrmWrites } from '@zoho-studio/zoho-crm'

import { startCrmStub, type CrmStub } from '../../support/crm-stub'

let crm: CrmStub | null = null
let received: string[] = []

beforeEach(async () => {
    disallowCrmWrites()
    received = []
    crm = await startCrmStub((request) => {
        received.push(`${request.method} ${new URL(request.url).pathname}`)
        return Response.json({ data: [] })
    })
})

afterEach(async () => {
    await crm?.stop()
    crm = null
})

// Other specs rely on writes being allowed once they enabled them.
afterAll(allowCrmWrites)

describe('the CRM write gate', () => {
    test('lets GET requests through while writes are disallowed', async () => {
        await crmClient.get('/settings/modules')

        expect(received).toEqual(['GET /crm/v8/settings/modules'])
    })

    test('lets a COQL query through: it is a POST that only reads', async () => {
        await crmClient.post('/coql', { select_query: 'select id from Leads limit 1' })

        expect(received).toEqual(['POST /crm/v8/coql'])
    })

    test.each(['post', 'put', 'patch', 'delete'] as const)('refuses %s to another path and sends nothing', async (method) => {
        const request =
            method === 'delete' ? crmClient.delete('/Leads/1') : crmClient[method]('/settings/fields', { fields: [] })

        const error = await request.catch((caught: unknown) => caught)

        expect(error).toBeInstanceOf(CrmWritesDisabledError)
        expect((error as CrmWritesDisabledError).code).toBe('CRM_WRITES_DISABLED')
        expect((error as Error).message).toContain('allowCrmWrites()')
        expect(received).toEqual([])
    })

    test('reads the path without its query string', async () => {
        await crmClient.post('/coql?x=1', {})

        expect(received).toEqual(['POST /crm/v8/coql'])
    })

    test('sends a write once allowCrmWrites() was called', async () => {
        allowCrmWrites()

        await crmClient.post('/settings/fields', { fields: [] })

        expect(received).toEqual(['POST /crm/v8/settings/fields'])
    })
})
