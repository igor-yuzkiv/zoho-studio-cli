import { afterEach, describe, expect, test } from 'bun:test'

import { checkMigration, describeMigration, defineMigration } from '@zoho-studio/zoho-crm/migrations'

import { startCrmStub, type CrmStub } from '../../../support/crm-stub'

let crm: CrmStub | null = null

afterEach(async () => {
    await crm?.stop()
    crm = null
})

const modules = [
    { id: '1', api_name: 'Accounts', module_name: 'Accounts', singular_label: 'Account', plural_label: 'Accounts' },
    { id: '2', api_name: 'Projects', module_name: 'CustomModule1', singular_label: 'Project', plural_label: 'Projects' },
]
const projectFields = [{ id: '10', api_name: 'Code', field_label: 'Project Code', data_type: 'text' }]
const profiles = [
    { id: '100', api_name: 'Administrator', name: 'Administrator' },
    { id: '101', api_name: 'Standard', name: 'Standard' },
]

function startCrm(): Promise<CrmStub> {
    return startCrmStub((request) => {
        const { pathname } = new URL(request.url)

        if (pathname.endsWith('/settings/modules')) return Response.json({ modules })
        if (pathname.endsWith('/settings/fields')) return Response.json({ fields: projectFields, info: {} })
        if (pathname.endsWith('/settings/profiles')) return Response.json({ profiles, info: {} })

        return new Response(null, { status: 404 })
    })
}

describe('checkMigration', () => {
    test('finds no conflict and resolves the profiles of a new module', async () => {
        crm = await startCrm()
        const migration = defineMigration({
            create: {
                api_name: 'Invoices',
                singular_label: 'Invoice',
                plural_label: 'Invoices',
                profiles: ['Administrator', 'Standard'],
                fields: (schema) => schema.lookup('Account', { module: 'Accounts' }),
            },
        })

        expect(await checkMigration(describeMigration(migration))).toEqual({ conflicts: [], profileIds: ['100', '101'] })
    })

    test('reports a module that already exists by API name or label', async () => {
        crm = await startCrm()
        const migration = defineMigration({
            create: { api_name: 'projects', singular_label: 'Account', plural_label: 'Things', fields: () => {} },
        })

        expect((await checkMigration(describeMigration(migration))).conflicts).toEqual([
            'Module "Accounts" already has the singular_label "Account".',
            'Module "Projects" already has the api_name "projects".',
        ])
    })

    test('reports fields that collide with the fields Zoho adds to every new module', async () => {
        crm = await startCrm()
        const migration = defineMigration({
            create: {
                singular_label: 'Invoice',
                plural_label: 'Invoices',
                fields: (schema) => {
                    schema.email('Email')
                    schema.text('Invoice Name')
                    schema.text('Reference', { api_name: 'Owner' })
                },
            },
        })

        expect((await checkMigration(describeMigration(migration))).conflicts).toEqual([
            'Field "Email": the label is already taken by the field "Email" (Email).',
            'Field "Invoice Name": the label is already taken by the field "Invoice Name" (Name).',
            'Field "Reference": the API name is already taken by the field "Invoice Owner" (Owner).',
        ])
    })

    test('reports an update of a module that does not exist', async () => {
        crm = await startCrm()
        const migration = defineMigration({ update: { module: 'Invoices', fields: (schema) => schema.text('Code') } })

        expect((await checkMigration(describeMigration(migration))).conflicts).toEqual([
            'Module "Invoices" does not exist in Zoho CRM.',
        ])
    })

    test('reports fields already present in the updated module, regardless of case', async () => {
        crm = await startCrm()
        const migration = defineMigration({
            update: {
                module: 'Projects',
                fields: (schema) => {
                    schema.text('project code')
                    schema.text('Reference', { api_name: 'CODE' })
                    schema.text('Budget')
                },
            },
        })

        expect((await checkMigration(describeMigration(migration))).conflicts).toEqual([
            'Field "project code": the label is already taken by the field "Project Code" (Code).',
            'Field "Reference": the API name is already taken by the field "Project Code" (Code).',
        ])
        expect(crm.requestedUrls.find((url) => url.pathname.endsWith('/settings/fields'))?.searchParams.get('module')).toBe(
            'Projects'
        )
    })

    test('reports a lookup to a module that does not exist', async () => {
        crm = await startCrm()
        const migration = defineMigration({
            update: { module: 'Projects', fields: (schema) => schema.lookup('Vendor', { module: 'Vendors' }) },
        })

        expect((await checkMigration(describeMigration(migration))).conflicts).toEqual([
            'Field "Vendor": the lookup target module "Vendors" does not exist in Zoho CRM.',
        ])
    })

    test('reports a profile that does not exist', async () => {
        crm = await startCrm()
        const migration = defineMigration({
            create: { singular_label: 'Invoice', plural_label: 'Invoices', profiles: ['Sales'], fields: () => {} },
        })

        expect(await checkMigration(describeMigration(migration))).toEqual({
            conflicts: ['Zoho CRM has no profile named "Sales". Known profiles: Administrator, Standard.'],
            profileIds: [],
        })
    })

    test('fails when Zoho cannot be read', async () => {
        crm = await startCrmStub(() => Response.json({ code: 'INVALID_TOKEN' }, { status: 401 }))
        const migration = defineMigration({ update: { module: 'Projects', fields: (schema) => schema.text('Code') } })

        await expect(checkMigration(describeMigration(migration))).rejects.toThrow()
    })
})
