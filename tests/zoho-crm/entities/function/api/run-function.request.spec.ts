import { afterEach, describe, expect, test } from 'bun:test'

import { FunctionRequestError, runFunctionRequest } from '@zoho-studio/zoho-crm/function'

import { startCrmStub, type CrmStub } from '../../../../support/crm-stub'

let crm: CrmStub | null = null

afterEach(async () => {
    await crm?.stop()
    crm = null
})

const code = 'string button.send_quote(String id)\n{\n\tinfo id;\n\treturn "sent";\n}'

describe('runFunctionRequest', () => {
    test('posts the code and the arguments to the test action of the function, and answers what Zoho said', async () => {
        let body: unknown = null
        const answer = {
            functions: [{ status: 'success', output: { data_type: 'string', value: 'sent' }, logs: [] }],
        }
        crm = await startCrmStub(async (request) => {
            body = await request.json()
            return Response.json(answer)
        })

        const result = await runFunctionRequest('send_quote', code, { id: '1123' })

        expect(crm.requests[0]?.method).toBe('POST')
        expect(crm.requestedUrls[0]?.pathname).toBe('/crm/v8/settings/functions/send_quote/actions/test')
        expect(body).toEqual({ functions: [{ script: code, arguments: { id: '1123' } }] })
        expect(result).toEqual(answer)
    })

    test('reports a compilation error with its lines', async () => {
        crm = await startCrmStub(() =>
            Response.json(
                {
                    code: 'COMPILATION_ERROR',
                    message: 'compilation error',
                    details: { errors: [{ line: 4, index: 1, message: 'Missing ;' }] },
                    status: 'error',
                },
                { status: 400 }
            )
        )

        const failure = await runFunctionRequest('send_quote', code, {}).catch((error: unknown) => error)

        expect(failure).toBeInstanceOf(FunctionRequestError)
        expect((failure as FunctionRequestError).message).toBe(
            'compilation error (COMPILATION_ERROR)\n  line 4, position 1: Missing ;'
        )
    })
})
