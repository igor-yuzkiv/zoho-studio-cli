import { afterEach, describe, expect, test } from 'bun:test'

import { getProfilesListRequest } from '@zoho-studio/zoho-crm/profile'

import { startCrmStub, type CrmStub } from '../../../../support/crm-stub'

let crm: CrmStub | null = null

afterEach(async () => {
    await crm?.stop()
    crm = null
})

const administratorProfile = { id: '1', api_name: 'Administrator', name: 'Administrator' }
const standardProfile = { id: '2', api_name: 'Standard', name: 'Standard' }

describe('getProfilesListRequest', () => {
    test('requests the profiles endpoint and returns a single page', async () => {
        crm = await startCrmStub(() => Response.json({ profiles: [administratorProfile], info: { more_records: false } }))

        expect(await getProfilesListRequest()).toEqual([administratorProfile])
        expect(crm.requestedUrls[0]?.pathname).toEndWith('/settings/profiles')
        expect(crm.requestedUrls[0]?.searchParams.get('per_page')).toBe('200')
        expect(crm.requestedUrls).toHaveLength(1)
    })

    test('concatenates every page while Zoho reports more records', async () => {
        crm = await startCrmStub((request) => {
            const page = new URL(request.url).searchParams.get('page')

            return page === '1'
                ? Response.json({ profiles: [administratorProfile], info: { more_records: true } })
                : Response.json({ profiles: [standardProfile], info: { more_records: false } })
        })

        expect(await getProfilesListRequest()).toEqual([administratorProfile, standardProfile])
        expect(crm.requestedUrls.map((url) => url.searchParams.get('page'))).toEqual(['1', '2'])
    })

    test('returns an empty list when Zoho answers with no content', async () => {
        crm = await startCrmStub(() => new Response(null, { status: 204 }))

        expect(await getProfilesListRequest()).toEqual([])
    })

    test('fails when Zoho rejects the request', async () => {
        crm = await startCrmStub(() => Response.json({ code: 'OAUTH_SCOPE_MISMATCH' }, { status: 401 }))

        await expect(getProfilesListRequest()).rejects.toThrow(/401/)
    })
})
