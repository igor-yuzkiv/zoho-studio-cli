import { afterEach, describe, expect, test } from 'bun:test'

import { getOrganization } from '@/entities/organization'

import { startCrmStub, type CrmStub } from '../../support/crm-stub'

let crm: CrmStub | null = null

afterEach(async () => {
    await crm?.stop()
    crm = null
})

describe('getOrganization', () => {
    test('returns the organization record as Zoho sent it', async () => {
        const organization = { company_name: 'Acme Inc', id: '77', primary_email: 'a@acme.test' }
        crm = await startCrmStub(() => Response.json({ org: [organization] }))

        expect(await getOrganization()).toEqual(organization)
        expect(crm.requestedUrls[0]?.pathname).toEndWith('/org')
    })

    test('fails when the response holds no organization', async () => {
        crm = await startCrmStub(() => Response.json({ org: [] }))

        await expect(getOrganization()).rejects.toThrow(/no organization/)
    })
})
