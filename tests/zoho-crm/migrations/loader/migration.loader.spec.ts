import { afterEach, describe, expect, test } from 'bun:test'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import { listMigrations, loadMigration } from '@zoho-studio/zoho-crm/migrations'

import { createTempProject, removeTempProject } from '../../../support/temp-project'

let projectPath: string | null = null

afterEach(async () => {
    if (projectPath) await removeTempProject(projectPath)
    projectPath = null
})

async function projectWithMigrations(files: Record<string, string>): Promise<string> {
    const path = await createTempProject()
    const migrationsPath = join(path, 'migrations', 'zoho-crm')

    await mkdir(migrationsPath, { recursive: true })

    for (const [name, content] of Object.entries(files)) {
        await writeFile(join(migrationsPath, name), content)
    }

    return path
}

const updateSource = `export default { update: { module: 'Projects', fields: (schema) => schema.text('Code') } }\n`

describe('listMigrations', () => {
    test('lists the TypeScript migrations by file name, in name order', async () => {
        projectPath = await projectWithMigrations({
            '002-add-budget.ts': updateSource,
            '001-create-projects.ts': updateSource,
            'notes.md': '# not a migration',
        })

        expect(await listMigrations(projectPath)).toEqual(['001-create-projects', '002-add-budget'])
    })

    test('returns no migrations when the folder does not exist', async () => {
        projectPath = await createTempProject()

        expect(await listMigrations(projectPath)).toEqual([])
    })
})

describe('loadMigration', () => {
    test('returns the default export of the migration file', async () => {
        projectPath = await projectWithMigrations({ '001-add-code.ts': updateSource })

        const loaded = await loadMigration(projectPath, '001-add-code')

        expect(loaded.problem).toBeNull()
        expect(loaded.definition?.update?.module).toBe('Projects')
    })

    test('reports a file without a default export', async () => {
        projectPath = await projectWithMigrations({ '001-empty.ts': 'export const nothing = 1\n' })

        expect(await loadMigration(projectPath, '001-empty')).toEqual({
            definition: null,
            problem: 'Migration "001-empty" has no default export.',
        })
    })

    test('reports a file that fails to load', async () => {
        projectPath = await projectWithMigrations({ '001-broken.ts': 'throw new Error("boom")\n' })

        expect(await loadMigration(projectPath, '001-broken')).toEqual({
            definition: null,
            problem: 'Migration "001-broken" failed to load: boom',
        })
    })

    test('reports a migration that does not exist', async () => {
        projectPath = await projectWithMigrations({})

        expect((await loadMigration(projectPath, 'missing')).problem).toMatch(/^Migration "missing" failed to load/)
    })
})
