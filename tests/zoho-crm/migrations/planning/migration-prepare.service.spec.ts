import { afterEach, describe, expect, test } from 'bun:test'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import { prepareMigration } from '@zoho-studio/zoho-crm/migrations'

import { startCrmStub, type CrmStub } from '../../../support/crm-stub'

let crm: CrmStub | null = null

afterEach(async () => {
    await crm?.stop()
    crm = null
})

async function writeMigration(projectPath: string, name: string, source: string): Promise<void> {
    const migrationsPath = join(projectPath, 'migrations', 'zoho-crm')

    await mkdir(migrationsPath, { recursive: true })
    await writeFile(join(migrationsPath, `${name}.ts`), source)
}

function startCrm(): Promise<CrmStub> {
    return startCrmStub((request) => {
        const { pathname } = new URL(request.url)

        if (pathname.endsWith('/settings/modules')) {
            return Response.json({ modules: [{ id: '2', api_name: 'Projects', module_name: 'CustomModule1' }] })
        }

        return Response.json({ fields: [], info: {} })
    })
}

describe('prepareMigration', () => {
    test('returns the description and plan of a migration Zoho has no conflict with', async () => {
        crm = await startCrm()
        await writeMigration(
            crm.projectPath,
            '001-add-code',
            `export default { update: { module: 'Projects', fields: (schema) => schema.text('Code') } }\n`
        )

        expect(await prepareMigration(crm.projectPath, '001-add-code')).toEqual({
            name: '001-add-code',
            description: {
                action: 'update',
                module: { api_name: 'Projects' },
                fields: [{ field_label: 'Code', data_type: 'text' }],
            },
            plan: {
                steps: [{ kind: 'create-fields', module: 'Projects', fields: [{ field_label: 'Code', data_type: 'text' }] }],
            },
            conflicts: [],
        })
    })

    test('reports an invalid migration without asking Zoho', async () => {
        crm = await startCrm()
        await writeMigration(crm.projectPath, '001-empty', `export default { update: { module: 'Projects', fields: () => {} } }\n`)

        expect(await prepareMigration(crm.projectPath, '001-empty')).toEqual({
            name: '001-empty',
            description: null,
            plan: null,
            conflicts: ['An update must add at least one field.'],
        })
        expect(crm.requestedUrls).toHaveLength(0)
    })

    test('reports a migration that cannot be loaded', async () => {
        crm = await startCrm()

        expect((await prepareMigration(crm.projectPath, 'missing')).conflicts[0]).toMatch(/^Migration "missing" failed to load/)
    })
})
