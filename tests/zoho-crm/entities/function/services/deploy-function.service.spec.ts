import { afterEach, describe, expect, test } from 'bun:test'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'

import { deployFunctionSource, scaffoldFunctionSource } from '@zoho-studio/zoho-crm/function'

import { startCrmStub, type CrmStub } from '../../../../support/crm-stub'

let crm: CrmStub | null = null

afterEach(async () => {
    await crm?.stop()
    crm = null
})

const now = new Date('2026-10-18T12:00:00.000Z')
const options = { changelogTemplate: 'Deployed {date}', now }

const deployFilePath = (projectPath: string) =>
    join(projectPath, 'src', 'zoho-crm', 'functions', 'oz_sa_ping', 'oz_sa_ping.deploy.json')

async function addPingFunction(projectPath: string) {
    await scaffoldFunctionSource(projectPath, {
        name: 'oz_sa_ping',
        api_name: 'oz_sa_ping',
        description: 'Answers pong',
        category: 'Standalone',
        returnType: 'string',
    })
}

const created = () =>
    Response.json({ functions: [{ code: 'SUCCESS', details: { id: '1023' }, status: 'success' }] }, { status: 201 })
const updated = () => Response.json({ functions: [{ code: 'SUCCESS', details: { id: '1023' }, status: 'success' }] })

describe('deployFunctionSource', () => {
    test('creates a function without an id and records the id and the deployment', async () => {
        crm = await startCrmStub(created)
        await addPingFunction(crm.projectPath)

        const result = await deployFunctionSource(crm.projectPath, 'oz_sa_ping', { ...options, changelog: 'First' })

        expect(result).toEqual({ operation: 'create', id: '1023', changelog: 'First' })
        expect(crm.requests[0]?.method).toBe('POST')
        const deploy = await Bun.file(deployFilePath(crm.projectPath)).json()
        expect(deploy.id).toBe('1023')
        expect(deploy.deployments).toEqual([
            { date: '2026-10-18T12:00:00.000Z', operation: 'create', changelog: 'First' },
        ])
    })

    test('updates a function that has an id', async () => {
        crm = await startCrmStub((request) => (request.method === 'POST' ? created() : updated()))
        await addPingFunction(crm.projectPath)
        await deployFunctionSource(crm.projectPath, 'oz_sa_ping', { ...options, changelog: 'First' })

        const result = await deployFunctionSource(crm.projectPath, 'oz_sa_ping', { ...options, changelog: 'Second' })

        expect(result?.operation).toBe('update')
        expect(crm.requests[1]?.method).toBe('PUT')
        expect(crm.requestedUrls[1]?.pathname).toEndWith('/settings/functions/1023')
        const deploy = await Bun.file(deployFilePath(crm.projectPath)).json()
        expect(deploy.deployments.map((entry: { operation: string }) => entry.operation)).toEqual(['create', 'update'])
    })

    test('shows the plan before sending and sends nothing when it is declined', async () => {
        crm = await startCrmStub(created)
        await addPingFunction(crm.projectPath)
        const before = await Bun.file(deployFilePath(crm.projectPath)).text()
        let shownPlan: unknown = null

        const result = await deployFunctionSource(crm.projectPath, 'oz_sa_ping', {
            ...options,
            changelog: 'First',
            confirm: async (plan) => {
                shownPlan = plan
                return false
            },
        })

        expect(result).toBeNull()
        expect(shownPlan).toEqual({ operation: 'create', apiName: 'oz_sa_ping', id: null, changelog: 'First' })
        expect(crm.requests).toHaveLength(0)
        expect(await Bun.file(deployFilePath(crm.projectPath)).text()).toBe(before)
    })

    test('builds the changelog from the template when none is given', async () => {
        crm = await startCrmStub(created)
        await addPingFunction(crm.projectPath)

        const result = await deployFunctionSource(crm.projectPath, 'oz_sa_ping', options)

        expect(result?.changelog).toBe('Deployed 2026-10-18T12:00:00.000Z')
    })

    test('leaves the deploy file as it was when Zoho rejects the code', async () => {
        crm = await startCrmStub(() =>
            Response.json(
                {
                    code: 'COMPILATION_ERROR',
                    message: 'function have compilation errors',
                    details: {
                        errors: [{ line: 3, index: 0, message: 'The syntax is incorrect. Please check the format.' }],
                    },
                    status: 'error',
                },
                { status: 400 }
            )
        )
        await addPingFunction(crm.projectPath)
        const before = await Bun.file(deployFilePath(crm.projectPath)).text()

        await expect(deployFunctionSource(crm.projectPath, 'oz_sa_ping', options)).rejects.toThrow(/line 3, position 0/)
        expect(await Bun.file(deployFilePath(crm.projectPath)).text()).toBe(before)
    })

    test('explains a duplicate API name instead of binding to the existing function', async () => {
        crm = await startCrmStub(() =>
            Response.json(
                { functions: [{ code: 'DUPLICATE_DATA', message: 'Api name duplicate', status: 'error' }] },
                { status: 400 }
            )
        )
        await addPingFunction(crm.projectPath)

        await expect(deployFunctionSource(crm.projectPath, 'oz_sa_ping', options)).rejects.toThrow(
            /already has a function/
        )
        expect((await Bun.file(deployFilePath(crm.projectPath)).json()).id).toBeNull()
    })

    test('explains a function that no longer exists in Zoho', async () => {
        crm = await startCrmStub((request) =>
            request.method === 'POST'
                ? created()
                : Response.json({ code: 'INVALID_DATA', message: 'invalid data', status: 'error' }, { status: 400 })
        )
        await addPingFunction(crm.projectPath)
        await deployFunctionSource(crm.projectPath, 'oz_sa_ping', options)

        await expect(deployFunctionSource(crm.projectPath, 'oz_sa_ping', options)).rejects.toThrow(/no longer exists/)
    })

    test('fails without a request when the function has no source', async () => {
        crm = await startCrmStub(created)

        await expect(deployFunctionSource(crm.projectPath, 'oz_sa_ping', options)).rejects.toThrow(
            /src\/zoho-crm\/functions\/oz_sa_ping/
        )
        expect(crm.requests).toHaveLength(0)
    })

    test('fails without a request when the code does not declare the function', async () => {
        crm = await startCrmStub(created)
        await addPingFunction(crm.projectPath)
        const codePath = join(crm.projectPath, 'src', 'zoho-crm', 'functions', 'oz_sa_ping', 'oz_sa_ping.deluge')
        await Bun.write(codePath, 'string standalone.renamed()\n{\n\treturn "";\n}\n')

        await expect(deployFunctionSource(crm.projectPath, 'oz_sa_ping', options)).rejects.toThrow(
            /standalone\.oz_sa_ping/
        )
        expect(crm.requests).toHaveLength(0)
    })

    test('fails without a request when the deploy file is invalid', async () => {
        crm = await startCrmStub(created)
        await addPingFunction(crm.projectPath)
        const deploy = await Bun.file(deployFilePath(crm.projectPath)).json()
        await Bun.write(deployFilePath(crm.projectPath), JSON.stringify({ ...deploy, category: 'Dynamic' }))

        await expect(deployFunctionSource(crm.projectPath, 'oz_sa_ping', options)).rejects.toThrow(/category/)
        expect(crm.requests).toHaveLength(0)
    })

    test('points a project still keeping snapshots in src to the move', async () => {
        crm = await startCrmStub(created)
        const legacyFolder = join(crm.projectPath, 'src', 'zoho-crm', 'functions', 'old_snapshot')
        await mkdir(legacyFolder, { recursive: true })
        await Bun.write(join(legacyFolder, 'Old Snapshot.deluge'), '')

        await expect(deployFunctionSource(crm.projectPath, 'old_snapshot', options)).rejects.toThrow(
            /mv src\/zoho-crm data\/zoho-crm/
        )
        expect(crm.requests).toHaveLength(0)
    })
})
