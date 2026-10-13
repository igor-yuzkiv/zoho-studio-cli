import { afterEach, describe, expect, test } from 'bun:test'

import { createModuleRequest } from '@zoho-studio/zoho-crm/module'

import { startCrmStub, type CrmStub } from '../../../../support/crm-stub'

let crm: CrmStub | null = null

afterEach(async () => {
    await crm?.stop()
    crm = null
})

const projects = {
    api_name: 'Projects',
    singular_label: 'Project',
    plural_label: 'Projects',
    profiles: [{ id: '100' }],
}

describe('createModuleRequest', () => {
    test('posts the module wrapped in a single-item list and returns its id', async () => {
        crm = await startCrmStub(() =>
            Response.json(
                { modules: [{ code: 'SUCCESS', details: { id: '555' }, message: 'module created successfully', status: 'success' }] },
                { status: 201 }
            )
        )

        expect(await createModuleRequest(projects)).toEqual({ id: '555' })
        expect(crm.requests[0]?.method).toBe('POST')
        expect(crm.requestedUrls[0]?.pathname).toEndWith('/settings/modules')
        expect(JSON.parse(crm.requests[0]?.body ?? '')).toEqual({ modules: [projects] })
    })

    test('fails with the Zoho message and code when the module is rejected', async () => {
        crm = await startCrmStub(() =>
            Response.json(
                { modules: [{ code: 'DUPLICATE_DATA', details: { api_name: 'api_name' }, message: 'duplicate data', status: 'error' }] },
                { status: 400 }
            )
        )

        await expect(createModuleRequest(projects)).rejects.toThrow('duplicate data (DUPLICATE_DATA)')
    })
})
