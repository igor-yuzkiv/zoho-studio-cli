import { afterEach, describe, expect, test } from 'bun:test'

import { getGlobalPicklist } from '@/entities/global-picklist'

import { startCrmStub, type CrmStub } from '../../../support/crm-stub'

let crm: CrmStub | null = null

afterEach(async () => {
    await crm?.stop()
    crm = null
})

const detailedPicklist = {
    id: '6640142000000448025',
    api_name: 'Source',
    display_label: 'Source',
    pick_list_values: [{ id: '6640142000000448031', actual_value: 'Advertisement', sequence_number: 1 }],
}

describe('getGlobalPicklist', () => {
    test('returns the picklist with its values', async () => {
        crm = await startCrmStub(() => Response.json({ global_picklists: [detailedPicklist] }))

        expect(await getGlobalPicklist(detailedPicklist.id)).toEqual(detailedPicklist)
        expect(crm.requestedUrls[0]?.pathname).toEndWith(`/settings/global_picklists/${detailedPicklist.id}`)
    })

    test('fails when Zoho answers an unknown id with no content', async () => {
        crm = await startCrmStub(() => new Response(null, { status: 204 }))

        await expect(getGlobalPicklist('404')).rejects.toThrow(/no global picklist for id "404"/)
    })
})
