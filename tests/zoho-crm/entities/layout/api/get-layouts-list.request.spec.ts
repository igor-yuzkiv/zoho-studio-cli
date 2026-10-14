import { afterEach, describe, expect, test } from 'bun:test'

import { getLayoutsListRequest } from '@zoho-studio/zoho-crm/layout'

import { startCrmStub, type CrmStub } from '../../../../support/crm-stub'

let crm: CrmStub | null = null

afterEach(async () => {
    await crm?.stop()
    crm = null
})

const standardLayout = {
    id: '1',
    api_name: 'Standard__s',
    sections: [
        {
            api_name: 'Information__s',
            fields: [
                {
                    id: '10',
                    api_name: 'Total',
                    field_label: 'Total',
                    data_type: 'formula',
                    formula: { expression: '${Quantity}*2' },
                },
            ],
        },
    ],
}

describe('getLayoutsListRequest', () => {
    test('requests every layout mode of the module and returns the layouts', async () => {
        crm = await startCrmStub(() => Response.json({ layouts: [standardLayout] }))

        expect(await getLayoutsListRequest('Deals')).toEqual([standardLayout])
        expect(crm.requestedUrls[0]?.pathname).toEndWith('/settings/layouts')
        expect(crm.requestedUrls[0]?.searchParams.get('module')).toBe('Deals')
        expect(crm.requestedUrls[0]?.searchParams.get('mode')).toBe('all')
    })

    test('returns an empty list when Zoho answers with no content', async () => {
        crm = await startCrmStub(() => new Response(null, { status: 204 }))

        expect(await getLayoutsListRequest('Deals')).toEqual([])
    })

    test('fails when Zoho rejects the request', async () => {
        crm = await startCrmStub(() => Response.json({ code: 'INVALID_MODULE' }, { status: 400 }))

        await expect(getLayoutsListRequest('Missing')).rejects.toThrow(/400/)
    })
})
