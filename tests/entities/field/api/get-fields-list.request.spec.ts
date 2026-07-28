import { afterEach, describe, expect, test } from 'bun:test'

import { getFieldsList, getFieldsPage } from '@/entities/field'

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

const lastNameField = { id: '1', api_name: 'Last_Name', field_label: 'Last Name', data_type: 'text' }
const emailField = { id: '2', api_name: 'Email', field_label: 'Email', data_type: 'email' }

describe('getFieldsPage', () => {
    test('requests the asked module and page and returns it with its pagination info', async () => {
        await startProject(() =>
            Response.json({ fields: [lastNameField], info: { more_records: true, next_page_token: 'tok-2' } })
        )

        const page = await getFieldsPage({ module: 'Leads', per_page: 200, page: 3 })

        expect(page).toEqual({
            fields: [lastNameField],
            info: { more_records: true, next_page_token: 'tok-2' },
        })
        expect(requestedUrls[0]?.pathname).toEndWith('/settings/fields')
        expect(requestedUrls[0]?.searchParams.get('module')).toBe('Leads')
        expect(requestedUrls[0]?.searchParams.get('page')).toBe('3')
        expect(requestedUrls).toHaveLength(1)
    })

    test('reads a no-content answer as an empty page', async () => {
        await startProject(() => new Response(null, { status: 204 }))

        expect(await getFieldsPage({ module: 'Leads', per_page: 200, page: 1 })).toEqual({ fields: [], info: {} })
    })
})

describe('getFieldsList', () => {
    test('concatenates every page while Zoho reports more records', async () => {
        await startProject((request) => {
            const page = new URL(request.url).searchParams.get('page')

            return page === '1'
                ? Response.json({ fields: [lastNameField], info: { more_records: true, page: 1 } })
                : Response.json({ fields: [emailField], info: { more_records: false, page: 2 } })
        })

        expect(await getFieldsList('Leads')).toEqual([lastNameField, emailField])
        expect(requestedUrls.map((url) => url.searchParams.get('page'))).toEqual(['1', '2'])
        expect(requestedUrls.every((url) => url.searchParams.get('module') === 'Leads')).toBe(true)
    })

    test('follows the page token when Zoho returns one', async () => {
        await startProject((request) => {
            const token = new URL(request.url).searchParams.get('page_token')

            return token
                ? Response.json({ fields: [emailField], info: { more_records: false } })
                : Response.json({ fields: [lastNameField], info: { more_records: true, next_page_token: 'tok-2' } })
        })

        expect(await getFieldsList('Leads')).toEqual([lastNameField, emailField])
        expect(requestedUrls[1]?.searchParams.get('page_token')).toBe('tok-2')
        expect(requestedUrls[1]?.searchParams.get('module')).toBe('Leads')
    })

    test('stops when Zoho reports more records without advancing the page token', async () => {
        await startProject(() =>
            Response.json({ fields: [lastNameField], info: { more_records: true, next_page_token: 'tok-1' } })
        )

        expect(await getFieldsList('Leads')).toEqual([lastNameField, lastNameField])
    })

    test('returns an empty list when Zoho answers with no content', async () => {
        await startProject(() => new Response(null, { status: 204 }))

        expect(await getFieldsList('Leads')).toEqual([])
    })

    test('fails when a module is not available', async () => {
        await startProject(() => Response.json({ code: 'INVALID_MODULE' }, { status: 400 }))

        await expect(getFieldsList('Ghost')).rejects.toThrow(/400/)
    })
})
