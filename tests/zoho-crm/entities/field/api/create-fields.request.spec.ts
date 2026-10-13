import { afterEach, describe, expect, test } from 'bun:test'

import { createFields, maxFieldsPerCreateRequest } from '@zoho-studio/zoho-crm/field'

import { startCrmStub, type CrmStub } from '../../../../support/crm-stub'

let crm: CrmStub | null = null

afterEach(async () => {
    await crm?.stop()
    crm = null
})

const code = { field_label: 'Code', data_type: 'text', length: 50 }
const budget = { field_label: 'Budget', data_type: 'currency' }

const success = (id: string) => ({ code: 'SUCCESS', details: { id }, message: 'field created', status: 'success' })
const duplicate = { code: 'DUPLICATE_DATA', details: { api_name: 'Budget' }, message: 'Field label duplicate', status: 'error' }

describe('createFields', () => {
    test('posts the fields for the module and returns one success per field', async () => {
        crm = await startCrmStub(() => Response.json({ fields: [success('1'), success('2')] }, { status: 201 }))

        expect(await createFields('Projects', [code, budget])).toEqual([
            { status: 'success', id: '1' },
            { status: 'success', id: '2' },
        ])
        expect(crm.requests[0]?.method).toBe('POST')
        expect(crm.requestedUrls[0]?.pathname).toEndWith('/settings/fields')
        expect(crm.requestedUrls[0]?.searchParams.get('module')).toBe('Projects')
        expect(JSON.parse(crm.requests[0]?.body ?? '')).toEqual({ fields: [code, budget] })
    })

    test('reports each field of a partial success in request order', async () => {
        crm = await startCrmStub(() => Response.json({ fields: [success('1'), duplicate] }, { status: 207 }))

        expect(await createFields('Projects', [code, budget])).toEqual([
            { status: 'success', id: '1' },
            { status: 'error', code: 'DUPLICATE_DATA', message: 'Field label duplicate' },
        ])
    })

    test('reports every field when Zoho rejects all of them', async () => {
        crm = await startCrmStub(() => Response.json({ fields: [duplicate] }, { status: 400 }))

        expect(await createFields('Projects', [budget])).toEqual([
            { status: 'error', code: 'DUPLICATE_DATA', message: 'Field label duplicate' },
        ])
    })

    test('fails when the request itself is rejected', async () => {
        crm = await startCrmStub(() =>
            Response.json({ code: 'INVALID_MODULE', message: 'the module name given seems to be invalid', status: 'error' }, { status: 400 })
        )

        await expect(createFields('Missing', [code])).rejects.toThrow('the module name given seems to be invalid (INVALID_MODULE)')
    })

    test('refuses more fields than one request takes, without calling Zoho', async () => {
        crm = await startCrmStub(() => Response.json({}))
        const tooMany = Array.from({ length: maxFieldsPerCreateRequest + 1 }, (_, index) => ({
            field_label: `Field ${index}`,
            data_type: 'text',
        }))

        await expect(createFields('Projects', tooMany)).rejects.toThrow(/25/)
        expect(crm.requests).toHaveLength(0)
    })
})
