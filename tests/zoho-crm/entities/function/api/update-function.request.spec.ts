import { afterEach, describe, expect, test } from 'bun:test'

import { FunctionRequestError, updateFunctionRequest } from '@zoho-studio/zoho-crm/function'

import { startCrmStub, type CrmStub } from '../../../../support/crm-stub'

let crm: CrmStub | null = null

afterEach(async () => {
    await crm?.stop()
    crm = null
})

const pingCode = 'string standalone.oz_sa_ping()\n{\n\treturn "pong 2";\n}\n'

describe('updateFunctionRequest', () => {
    test('puts name, description, code and changelog to the function id, without the fields Zoho refuses to change', async () => {
        let form: Awaited<ReturnType<Request['formData']>> | null = null
        crm = await startCrmStub(async (request) => {
            form = await request.formData()
            return Response.json({
                functions: [
                    {
                        code: 'SUCCESS',
                        details: { id: '1023' },
                        message: 'function updated successfully',
                        status: 'success',
                    },
                ],
            })
        })

        await updateFunctionRequest(
            '1023',
            { name: 'oz_sa_ping', api_name: 'oz_sa_ping', description: 'Answers pong twice' },
            pingCode,
            'Second version'
        )

        expect(crm.requests[0]?.method).toBe('PUT')
        expect(crm.requestedUrls[0]?.pathname).toEndWith('/settings/functions/1023')
        expect(JSON.parse(form!.get('metadata') as string)).toEqual({
            functions: [{ name: 'oz_sa_ping', description: 'Answers pong twice' }],
            publish: { changelog: 'Second version' },
        })
        expect((form!.get('code') as File).name).toBe('oz_sa_ping.ds')
        expect(await (form!.get('code') as File).text()).toBe(pingCode)
    })

    test('fails on a success status whose function was rejected', async () => {
        crm = await startCrmStub(() =>
            Response.json(
                { functions: [{ code: 'COMPILATION_ERROR', message: 'function saved as draft', status: 'error' }] },
                { status: 207 }
            )
        )

        await expect(
            updateFunctionRequest('1023', { name: 'x', api_name: 'x', description: '' }, pingCode, 'x')
        ).rejects.toThrow('function saved as draft (COMPILATION_ERROR)')
    })

    test('reports a function deleted in Zoho as invalid data', async () => {
        crm = await startCrmStub(() =>
            Response.json(
                { code: 'INVALID_DATA', details: { resource_path_index: 2 }, message: 'invalid data', status: 'error' },
                { status: 400 }
            )
        )

        const failure = await updateFunctionRequest(
            '1023',
            { name: 'x', api_name: 'x', description: '' },
            pingCode,
            'x'
        ).catch((error: unknown) => error)

        expect(failure).toBeInstanceOf(FunctionRequestError)
        expect((failure as FunctionRequestError).code).toBe('INVALID_DATA')
    })
})
