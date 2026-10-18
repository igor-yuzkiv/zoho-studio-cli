import { afterEach, describe, expect, test } from 'bun:test'

import { createFunctionRequest, FunctionRequestError } from '@zoho-studio/zoho-crm/function'

import { startCrmStub, type CrmStub } from '../../../../support/crm-stub'

let crm: CrmStub | null = null

afterEach(async () => {
    await crm?.stop()
    crm = null
})

const ping = {
    name: 'oz_sa_ping',
    api_name: 'oz_sa_ping',
    description: 'Answers pong',
    category: 'Standalone' as const,
    runtime: 'Deluge 1.0',
}
const pingCode = 'string standalone.oz_sa_ping()\n{\n\treturn "pong";\n}\n'

describe('createFunctionRequest', () => {
    test('sends the metadata as a text field and the code as a .ds file, and returns the new id', async () => {
        let form: Awaited<ReturnType<Request['formData']>> | null = null
        crm = await startCrmStub(async (request) => {
            form = await request.formData()
            return Response.json(
                {
                    functions: [
                        {
                            code: 'SUCCESS',
                            details: { id: '1023' },
                            message: 'function created successfully',
                            status: 'success',
                        },
                    ],
                },
                { status: 201 }
            )
        })

        expect(await createFunctionRequest(ping, pingCode, 'First version')).toEqual({ id: '1023' })

        expect(crm.requests[0]?.method).toBe('POST')
        expect(crm.requestedUrls[0]?.pathname).toEndWith('/settings/functions')
        const metadata = form!.get('metadata')
        expect(typeof metadata).toBe('string')
        expect(JSON.parse(metadata as string)).toEqual({ functions: [ping], publish: { changelog: 'First version' } })
        const code = form!.get('code') as File
        expect(code.name).toBe('oz_sa_ping.ds')
        expect(await code.text()).toBe(pingCode)
    })

    test('reports a duplicate API name with its Zoho code', async () => {
        crm = await startCrmStub(() =>
            Response.json(
                {
                    functions: [
                        {
                            code: 'DUPLICATE_DATA',
                            details: { api_name: 'api_name' },
                            message: 'Api name duplicate',
                            status: 'error',
                        },
                    ],
                },
                { status: 400 }
            )
        )

        const failure = await createFunctionRequest(ping, pingCode, 'x').catch((error: unknown) => error)

        expect(failure).toBeInstanceOf(FunctionRequestError)
        expect((failure as FunctionRequestError).code).toBe('DUPLICATE_DATA')
        expect((failure as Error).message).toBe('Api name duplicate (DUPLICATE_DATA)')
    })

    test('lists every compilation error with its line and position', async () => {
        crm = await startCrmStub(() =>
            Response.json(
                {
                    code: 'COMPILATION_ERROR',
                    details: {
                        param_name: 'code',
                        errors: [
                            {
                                line: 1,
                                index: 0,
                                message:
                                    "Invalid return type 'void' for category 'Standalone'. Allowed types: [string]",
                            },
                        ],
                    },
                    message: 'function have compilation errors',
                    status: 'error',
                },
                { status: 400 }
            )
        )

        const failure = (await createFunctionRequest(ping, pingCode, 'x').catch(
            (error: unknown) => error
        )) as FunctionRequestError

        expect(failure.code).toBe('COMPILATION_ERROR')
        expect(failure.compilationErrors).toEqual([
            {
                line: 1,
                index: 0,
                message: "Invalid return type 'void' for category 'Standalone'. Allowed types: [string]",
            },
        ])
        expect(failure.message).toBe(
            "function have compilation errors (COMPILATION_ERROR)\n  line 1, position 0: Invalid return type 'void' for category 'Standalone'. Allowed types: [string]"
        )
    })
})
