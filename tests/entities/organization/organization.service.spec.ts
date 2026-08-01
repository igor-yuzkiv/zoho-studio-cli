import { afterEach, describe, expect, test } from 'bun:test'

import { formatOrganization, pullOrganization } from '@/entities/organization'
import { resolveProjectOrganizationPath } from '@/config'

import { buildSettings, createTempProject, removeTempProject } from '../../support/temp-project'

function storedOrganizationFile(): ReturnType<typeof Bun.file> {
    return Bun.file(resolveProjectOrganizationPath(projectPath!))
}

let projectPath: string | null = null
let crmServer: ReturnType<typeof Bun.serve> | null = null

const validTokens = { accessToken: 'access', refreshToken: 'refresh', accessTokenExpiresAt: Date.now() + 3_600_000 }

const organization = {
    company_name: 'Acme Inc',
    id: '77',
    type: 'sandbox',
    primary_email: 'a@acme.test',
    city: 'Statesville',
    state: 'NC',
    country_code: 'US',
    license_details: { paid_type: 'zohooneenterprise', users_license_purchased: 20 },
}

async function startProject(crmAnswer: unknown, status = 200): Promise<void> {
    crmServer = Bun.serve({ port: 0, fetch: () => Response.json(crmAnswer, { status }) })

    projectPath = await createTempProject(
        buildSettings({
            auth: { tokens: validTokens },
            api: { baseUrl: crmServer.url.origin, version: 'v8' },
        })
    )
}

afterEach(async () => {
    crmServer?.stop(true)
    crmServer = null

    if (projectPath) {
        await removeTempProject(projectPath)
        projectPath = null
    }
})

describe('pullOrganization', () => {
    test('stores the organization next to the settings', async () => {
        await startProject({ org: [organization] })

        const snapshot = await pullOrganization()

        expect(snapshot.projectPath).toBe(projectPath!)
        expect(snapshot.organizationPath).toBe(resolveProjectOrganizationPath(projectPath!))
        expect(snapshot.organization).toEqual(organization)
        expect(await storedOrganizationFile().json()).toEqual(organization)
    })

    test('leaves no file when Zoho answers with an error', async () => {
        await startProject({ code: 'INVALID_TOKEN' }, 401)

        await expect(pullOrganization()).rejects.toThrow(/401/)

        expect(await storedOrganizationFile().exists()).toBe(false)
    })
})

describe('formatOrganization', () => {
    test('prints the named fields and the joined location', () => {
        expect(formatOrganization(organization)).toEqual([
            'Organization: Acme Inc',
            '  id: 77',
            '  type: sandbox',
            '  primary email: a@acme.test',
            '  location: Statesville, NC, US',
            '  licence: zohooneenterprise, 20 users',
        ])
    })

    test('omits the fields Zoho left empty', () => {
        expect(formatOrganization({ company_name: 'Acme Inc', website: null, phone: '' })).toEqual([
            'Organization: Acme Inc',
        ])
    })

    test('reports a missing company name rather than hiding the line', () => {
        expect(formatOrganization({ id: '77' })).toEqual(['Organization: unknown', '  id: 77'])
    })
})
