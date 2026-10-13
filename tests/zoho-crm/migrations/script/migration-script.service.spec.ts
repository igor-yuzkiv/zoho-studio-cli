import { afterEach, beforeEach, describe, expect, spyOn, test, type Mock } from 'bun:test'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import { runMigrationScript } from '@zoho-studio/zoho-crm/migrations'

import { startCrmStub, type CrmStub } from '../../../support/crm-stub'

let crm: CrmStub | null = null
let log: Mock<typeof console.log>
let error: Mock<typeof console.error>

beforeEach(() => {
    log = spyOn(console, 'log').mockImplementation(() => {})
    error = spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(async () => {
    log.mockRestore()
    error.mockRestore()
    await crm?.stop()
    crm = null
})

function startCrm(): Promise<CrmStub> {
    return startCrmStub((request) => {
        const { pathname } = new URL(request.url)

        if (pathname.endsWith('/org')) return Response.json({ org: [{ id: 'org-1' }] })
        if (pathname.endsWith('/settings/modules') && request.method === 'GET') {
            return Response.json({ modules: [{ id: '7', api_name: 'Projects', module_name: 'CustomModule1' }] })
        }
        if (pathname.endsWith('/settings/fields') && request.method === 'GET') {
            return Response.json({ fields: [{ id: '9', api_name: 'Code', field_label: 'Code', data_type: 'text' }], info: {} })
        }

        return Response.json({ fields: [{ code: 'SUCCESS', details: { id: '10' }, status: 'success' }] }, { status: 201 })
    })
}

async function writeMigration(name: string, source: string): Promise<void> {
    const migrationsPath = join(crm!.projectPath, 'migrations', 'zoho-crm')

    await mkdir(migrationsPath, { recursive: true })
    await writeFile(join(migrationsPath, `${name}.ts`), source)
}

const addDone = `export default { update: { module: 'Projects', fields: (schema) => schema.boolean('Done') } }\n`
const addCode = `export default { update: { module: 'Projects', fields: (schema) => schema.text('Code') } }\n`

const printed = () => log.mock.calls.map(([line]) => String(line))
const writes = () => crm!.requests.filter((request) => request.method === 'POST')

describe('runMigrationScript', () => {
    test('shows the plan of a dry run without writing to Zoho', async () => {
        crm = await startCrm()
        await writeMigration('001-done', addDone)

        expect(await runMigrationScript(['001-done', '--dry-run'])).toBe(0)
        expect(printed()).toContain('  1. create 1 field in Projects')
        expect(writes()).toHaveLength(0)
    })

    test('runs a migration with --yes and prints one JSON event per line with --json', async () => {
        crm = await startCrm()
        await writeMigration('001-done', addDone)

        expect(await runMigrationScript(['001-done', '--yes', '--json'])).toBe(0)

        const events = printed().map((line) => JSON.parse(line))
        expect(events[0]).toMatchObject({ type: 'prepared', migration: { name: '001-done', conflicts: [] } })
        expect(events.at(-1)).toMatchObject({ type: 'finished', status: 'applied' })
        expect(writes()).toHaveLength(1)
    })

    test('stops with exit code 1 and lists the conflicts', async () => {
        crm = await startCrm()
        await writeMigration('001-code', addCode)

        expect(await runMigrationScript(['001-code', '--yes'])).toBe(1)
        expect(printed()).toContain('Conflicts:')
        expect(writes()).toHaveLength(0)
    })

    test('refuses --json without a migration name or a way to skip the prompt', async () => {
        crm = await startCrm()

        expect(await runMigrationScript(['--json'])).toBe(1)
        expect(await runMigrationScript(['001-done', '--json'])).toBe(1)
        expect(crm.requests).toHaveLength(0)
    })
})
