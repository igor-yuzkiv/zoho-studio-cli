import { afterEach, describe, expect, test } from 'bun:test'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import {
    buildMigrationPlan,
    defineMigration,
    describeMigration,
    readMigrationJournal,
    runMigration,
    type MigrationDefinition,
    type MigrationEvent,
    type PreparedMigration,
} from '@zoho-studio/zoho-crm/migrations'

import { startCrmStub, type CrmStub } from '../../../support/crm-stub'

let crm: CrmStub | null = null

afterEach(async () => {
    await crm?.stop()
    crm = null
})

interface CrmState {
    orgId: string
    modules: { id: string; api_name: string; module_name: string }[]
    fields: Record<string, { id: string; api_name: string; field_label: string; data_type: string }[]>
    rejectModule?: boolean
    rejectedLabels?: string[]
    generatedApiName?: string
    hideCreatedModule?: boolean
    failFieldsRead?: boolean
}

/** A CRM that remembers what was created, so the run can read it back. */
function startCrm(state: CrmState): Promise<CrmStub> {
    let nextId = 500

    return startCrmStub(async (request) => {
        const url = new URL(request.url)

        if (url.pathname.endsWith('/org')) return Response.json({ org: [{ id: state.orgId }] })

        if (url.pathname.endsWith('/settings/modules') && request.method === 'POST') {
            if (state.rejectModule) {
                return Response.json(
                    { modules: [{ code: 'LIMIT_EXCEEDED', message: 'limit exceeded', status: 'error' }] },
                    { status: 400 }
                )
            }

            const [module] = ((await request.json()) as { modules: { api_name?: string }[] }).modules
            const id = String(nextId++)
            const apiName = module!.api_name ?? state.generatedApiName!

            if (!state.hideCreatedModule) state.modules.push({ id, api_name: apiName, module_name: 'CustomModule9' })
            state.fields[apiName] = []

            return Response.json({ modules: [{ code: 'SUCCESS', details: { id }, status: 'success' }] }, { status: 201 })
        }

        if (url.pathname.endsWith('/settings/modules')) return Response.json({ modules: state.modules })

        const moduleName = url.searchParams.get('module') ?? ''

        if (url.pathname.endsWith('/settings/fields') && request.method === 'POST') {
            const { fields } = (await request.json()) as { fields: { field_label: string; api_name?: string }[] }
            const outcomes = fields.map((field) => {
                if (state.rejectedLabels?.includes(field.field_label)) {
                    return { code: 'INVALID_DATA', message: 'invalid data', status: 'error' }
                }

                const id = String(nextId++)
                state.fields[moduleName]!.push({
                    id,
                    api_name: field.api_name ?? field.field_label.replace(/ /g, '_'),
                    field_label: field.field_label,
                    data_type: 'text',
                })

                return { code: 'SUCCESS', details: { id }, status: 'success' }
            })

            return Response.json({ fields: outcomes }, { status: state.rejectedLabels ? 207 : 201 })
        }

        if (url.pathname.endsWith('/settings/fields')) {
            if (state.failFieldsRead) return Response.json({ code: 'INTERNAL_ERROR', message: 'internal error' }, { status: 500 })

            return Response.json({ fields: state.fields[moduleName] ?? [], info: {} })
        }

        return new Response(null, { status: 404 })
    })
}

function prepare(name: string, definition: MigrationDefinition, conflicts: string[] = []): PreparedMigration {
    const description = describeMigration(definition)

    return { name, description, plan: buildMigrationPlan(description, ['100']), conflicts }
}

async function run(prepared: PreparedMigration) {
    const events: MigrationEvent[] = []
    const status = await runMigration(crm!.projectPath, prepared, (event) => events.push(event))

    return { status, events }
}

const createInvoices = defineMigration({
    create: {
        api_name: 'Invoices',
        singular_label: 'Invoice',
        plural_label: 'Invoices',
        fields: (schema) => {
            schema.text('Number')
            schema.currency('Total')
        },
    },
})

describe('runMigration', () => {
    test('creates the module and its fields, verifies them, refreshes the artifacts, and journals the run', async () => {
        crm = await startCrm({ orgId: 'org-1', modules: [], fields: {} })

        const { status, events } = await run(prepare('001-invoices', createInvoices))

        expect(status).toBe('applied')
        expect(events.map((event) => event.type)).toEqual([
            'step-started',
            'module-created',
            'step-finished',
            'step-started',
            'field-result',
            'field-result',
            'step-finished',
            'verified',
            'artifacts-updated',
            'finished',
        ])
        expect(events.find((event) => event.type === 'verified')).toEqual({
            type: 'verified',
            verification: { module: 'Invoices', created: ['Number', 'Total'], missing: [] },
        })

        const modulePath = join(crm.projectPath, 'data', 'zoho-crm', 'modules', 'Invoices')
        expect(JSON.parse(await readFile(join(modulePath, 'Invoices.metadata.json'), 'utf8')).id).toBe('500')
        expect(JSON.parse(await readFile(join(modulePath, 'fields', 'Number.json'), 'utf8')).field_label).toBe('Number')

        expect(await readMigrationJournal(crm.projectPath, 'org-1')).toEqual({
            '001-invoices': {
                status: 'applied',
                ranAt: expect.any(String),
                moduleId: '500',
                fieldIds: { Number: '501', Total: '502' },
            },
        })
    })

    test('stops at a field Zoho rejects and reports what is missing', async () => {
        crm = await startCrm({ orgId: 'org-1', modules: [], fields: {}, rejectedLabels: ['Total'] })

        const { status, events } = await run(prepare('001-invoices', createInvoices))

        expect(status).toBe('failed')
        expect(events).toContainEqual({
            type: 'field-result',
            index: 1,
            field_label: 'Total',
            result: { status: 'error', code: 'INVALID_DATA', message: 'invalid data' },
        })
        expect(events).toContainEqual({
            type: 'verified',
            verification: { module: 'Invoices', created: ['Number'], missing: ['Total'] },
        })
        expect((await readMigrationJournal(crm.projectPath, 'org-1'))['001-invoices']).toMatchObject({
            status: 'failed',
            error: '1 of 2 fields were not created.',
            fieldIds: { Number: '501' },
        })
    })

    test('creates nothing more when Zoho rejects the module', async () => {
        crm = await startCrm({ orgId: 'org-1', modules: [], fields: {}, rejectModule: true })

        const { status, events } = await run(prepare('001-invoices', createInvoices))

        expect(status).toBe('failed')
        expect(events.map((event) => event.type)).toEqual(['step-started', 'step-finished', 'finished'])
        expect(crm.requests.filter((request) => request.method === 'POST')).toHaveLength(1)
        expect((await readMigrationJournal(crm.projectPath, 'org-1'))['001-invoices']).toMatchObject({
            status: 'failed',
            error: 'limit exceeded (LIMIT_EXCEEDED)',
        })
    })

    test('learns the API name Zoho gave a module created without one', async () => {
        crm = await startCrm({ orgId: 'org-1', modules: [], fields: {}, generatedApiName: 'Bills' })
        const migration = defineMigration({
            create: { singular_label: 'Bill', plural_label: 'Bills', fields: (schema) => schema.text('Number') },
        })

        const { status, events } = await run(prepare('001-bills', migration))

        expect(status).toBe('applied')
        expect(events).toContainEqual({ type: 'module-created', id: '500', api_name: 'Bills' })
        expect(crm.requestedUrls.at(-3)?.searchParams.get('module')).toBe('Bills')
    })

    test('journals the id of a created module even when its API name cannot be learned', async () => {
        crm = await startCrm({ orgId: 'org-1', modules: [], fields: {}, hideCreatedModule: true })
        const migration = defineMigration({
            create: { singular_label: 'Bill', plural_label: 'Bills', fields: (schema) => schema.text('Number') },
        })

        const { status } = await run(prepare('001-bills', migration))

        expect(status).toBe('failed')
        expect((await readMigrationJournal(crm.projectPath, 'org-1'))['001-bills']).toMatchObject({
            status: 'failed',
            moduleId: '500',
        })
    })

    test('still journals the run when reading the result back fails', async () => {
        crm = await startCrm({ orgId: 'org-1', modules: [], fields: {}, failFieldsRead: true })

        const { status, events } = await run(prepare('001-invoices', createInvoices))

        expect(status).toBe('applied')
        expect(events).toContainEqual({
            type: 'verification-failed',
            error: 'internal error (INTERNAL_ERROR)',
        })
        expect((await readMigrationJournal(crm.projectPath, 'org-1'))['001-invoices']).toMatchObject({ status: 'applied' })
    })

    test('adds fields to an existing module', async () => {
        crm = await startCrm({
            orgId: 'org-1',
            modules: [{ id: '7', api_name: 'Projects', module_name: 'CustomModule1' }],
            fields: { Projects: [] },
        })
        const migration = defineMigration({ update: { module: 'Projects', fields: (schema) => schema.boolean('Done') } })

        const { status } = await run(prepare('002-done', migration))

        expect(status).toBe('applied')
        expect((await readMigrationJournal(crm.projectPath, 'org-1'))['002-done']).toMatchObject({
            status: 'applied',
            fieldIds: { Done: '500' },
        })
    })

    test('refuses a migration with conflicts without touching Zoho', async () => {
        crm = await startCrm({ orgId: 'org-1', modules: [], fields: {} })

        const { status, events } = await run(prepare('001-invoices', createInvoices, ['Module "Invoices" exists.']))

        expect(status).toBe('blocked')
        expect(events).toEqual([{ type: 'finished', status: 'blocked', message: 'The migration has 1 conflict.' }])
        expect(crm.requests).toHaveLength(0)
        expect(await readMigrationJournal(crm.projectPath, 'org-1')).toEqual({})
    })

    test('refuses a migration already applied, keeping the journal per organization', async () => {
        crm = await startCrm({ orgId: 'org-1', modules: [], fields: {} })
        await run(prepare('001-invoices', createInvoices))

        const again = await run(prepare('001-invoices', createInvoices))

        expect(again.status).toBe('blocked')
        expect(again.events.at(-1)).toMatchObject({ type: 'finished', status: 'blocked' })
        expect(await readMigrationJournal(crm.projectPath, 'org-2')).toEqual({})
    })
})
