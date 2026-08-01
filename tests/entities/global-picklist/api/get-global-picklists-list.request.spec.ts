import { afterEach, describe, expect, test } from 'bun:test'

import { getGlobalPicklistsList, getGlobalPicklistsPage } from '@/entities/global-picklist'

import { startCrmStub, type CrmStub } from '../../../support/crm-stub'

let crm: CrmStub | null = null

afterEach(async () => {
    await crm?.stop()
    crm = null
})

const sourcePicklist = { id: '1', api_name: 'Source', display_label: 'Source' }
const industryPicklist = { id: '2', api_name: 'Industry', display_label: 'Industry' }

describe('getGlobalPicklistsPage', () => {
    test('requests the asked page and returns it with its pagination info', async () => {
        crm = await startCrmStub(() => Response.json({ global_picklists: [sourcePicklist], info: { more_records: true } }))

        const page = await getGlobalPicklistsPage({ per_page: 200, page: 3 })

        expect(page).toEqual({ globalPicklists: [sourcePicklist], info: { more_records: true } })
        expect(crm.requestedUrls[0]?.pathname).toEndWith('/settings/global_picklists')
        expect(crm.requestedUrls[0]?.searchParams.get('page')).toBe('3')
        expect(crm.requestedUrls).toHaveLength(1)
    })

    test('reads a no-content answer as an empty page', async () => {
        crm = await startCrmStub(() => new Response(null, { status: 204 }))

        expect(await getGlobalPicklistsPage({ per_page: 200, page: 1 })).toEqual({ globalPicklists: [], info: {} })
    })
})

describe('getGlobalPicklistsList', () => {
    test('concatenates every page while Zoho reports more records', async () => {
        crm = await startCrmStub((request) => {
            const page = new URL(request.url).searchParams.get('page')

            return page === '1'
                ? Response.json({ global_picklists: [sourcePicklist], info: { more_records: true } })
                : Response.json({ global_picklists: [industryPicklist], info: { more_records: false } })
        })

        expect(await getGlobalPicklistsList()).toEqual([sourcePicklist, industryPicklist])
        expect(crm.requestedUrls.map((url) => url.searchParams.get('page'))).toEqual(['1', '2'])
    })

    test('returns an empty list when Zoho answers with no content', async () => {
        crm = await startCrmStub(() => new Response(null, { status: 204 }))

        expect(await getGlobalPicklistsList()).toEqual([])
    })

    test('fails when Zoho rejects the request', async () => {
        crm = await startCrmStub(() => Response.json({ code: 'OAUTH_SCOPE_MISMATCH' }, { status: 401 }))

        await expect(getGlobalPicklistsList()).rejects.toThrow(/401/)
    })
})
