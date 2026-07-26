import { afterEach, describe, expect, test } from 'bun:test'

import { getFunctionsList, getFunctionsPage } from '@/entities/function'

import { buildSettings, createTempProject, removeTempProject } from '../../../support/temp-project'

let projectPath: string | null = null
let crmServer: ReturnType<typeof Bun.serve> | null = null
let accountsServer: ReturnType<typeof Bun.serve> | null = null
let requestedUrls: URL[] = []

async function startProject(answer: (request: Request) => Response): Promise<void> {
    crmServer = Bun.serve({
        port: 0,
        fetch(request) {
            requestedUrls.push(new URL(request.url))

            return answer(request)
        },
    })

    accountsServer = Bun.serve({
        port: 0,
        fetch: () => Response.json({ access_token: 'fresh', expires_in: 3600, token_type: 'Bearer' }),
    })

    projectPath = await createTempProject(
        buildSettings({
            auth: {
                baseUrl: accountsServer.url.origin,
                tokens: {
                    accessToken: 'access',
                    refreshToken: 'refresh',
                    accessTokenExpiresAt: Date.now() + 3_600_000,
                },
            },
            api: { baseUrl: crmServer.url.origin, version: 'v8' },
        })
    )
}

afterEach(async () => {
    crmServer?.stop(true)
    accountsServer?.stop(true)
    crmServer = null
    accountsServer = null
    requestedUrls = []

    if (projectPath) {
        await removeTempProject(projectPath)
        projectPath = null
    }
})

const firstFunction = { id: '1', name: 'first', api_name: 'first', category: 'Button' }
const secondFunction = { id: '2', name: 'second', api_name: 'second', category: 'Automation' }

describe('getFunctionsPage', () => {
    test('requests the asked page and returns it with its pagination info', async () => {
        await startProject(() =>
            Response.json({ functions: [firstFunction], info: { more_records: true, next_page_token: 'tok-2' } })
        )

        const page = await getFunctionsPage({ per_page: 200, page: 3 })

        expect(page).toEqual({
            functions: [firstFunction],
            info: { more_records: true, next_page_token: 'tok-2' },
        })
        expect(requestedUrls[0]?.searchParams.get('page')).toBe('3')
        expect(requestedUrls).toHaveLength(1)
    })

    test('reads a no-content answer as an empty page', async () => {
        await startProject(() => new Response(null, { status: 204 }))

        expect(await getFunctionsPage({ per_page: 200, page: 1 })).toEqual({ functions: [], info: {} })
    })
})

describe('getFunctionsList', () => {
    test('concatenates every page while Zoho reports more records', async () => {
        await startProject((request) => {
            const page = new URL(request.url).searchParams.get('page')

            return page === '1'
                ? Response.json({ functions: [firstFunction], info: { more_records: true, page: 1 } })
                : Response.json({ functions: [secondFunction], info: { more_records: false, page: 2 } })
        })

        expect(await getFunctionsList()).toEqual([firstFunction, secondFunction])
        expect(requestedUrls.map((url) => url.searchParams.get('page'))).toEqual(['1', '2'])
    })

    test('follows the page token when Zoho returns one', async () => {
        await startProject((request) => {
            const token = new URL(request.url).searchParams.get('page_token')

            return token
                ? Response.json({ functions: [secondFunction], info: { more_records: false } })
                : Response.json({ functions: [firstFunction], info: { more_records: true, next_page_token: 'tok-2' } })
        })

        expect(await getFunctionsList()).toEqual([firstFunction, secondFunction])
        expect(requestedUrls[1]?.searchParams.get('page_token')).toBe('tok-2')
    })

    test('stops when Zoho reports more records without advancing the page token', async () => {
        await startProject(() =>
            Response.json({ functions: [firstFunction], info: { more_records: true, next_page_token: 'tok-1' } })
        )

        expect(await getFunctionsList()).toEqual([firstFunction, firstFunction])
    })

    test('returns an empty list when Zoho answers with no content', async () => {
        await startProject(() => new Response(null, { status: 204 }))

        expect(await getFunctionsList()).toEqual([])
    })

    test('fails when a page request fails', async () => {
        await startProject((request) => {
            const page = new URL(request.url).searchParams.get('page')

            return page === '1'
                ? Response.json({ functions: [firstFunction], info: { more_records: true } })
                : Response.json({ code: 'INTERNAL_ERROR' }, { status: 500 })
        })

        await expect(getFunctionsList()).rejects.toThrow(/500/)
    })
})
