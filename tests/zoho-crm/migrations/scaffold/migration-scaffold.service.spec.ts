import { afterEach, describe, expect, test } from 'bun:test'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join, relative } from 'node:path'

import {
    listMigrations,
    loadMigration,
    planMigrationScaffold,
    scaffoldMigration,
    validateMigration,
} from '@zoho-studio/zoho-crm/migrations'

import { createTempProject, removeTempProject } from '../../../support/temp-project'

let projectPath: string | null = null

afterEach(async () => {
    if (projectPath) await removeTempProject(projectPath)
    projectPath = null
})

describe('scaffoldMigration', () => {
    test('creates the next numbered migration file, which the migrate list then shows', async () => {
        projectPath = await createTempProject()
        const migrationsPath = join(projectPath, 'migrations', 'zoho-crm')
        await mkdir(migrationsPath, { recursive: true })
        await writeFile(join(migrationsPath, '001-create-projects.ts'), '')

        const migration = await scaffoldMigration(projectPath, { action: 'update', module: 'Projects' })

        expect(migration.name).toBe('002-update-projects')
        expect(relative(projectPath, migration.path)).toBe('migrations/zoho-crm/002-update-projects.ts')
        expect(await readFile(migration.path, 'utf8')).toContain("module: 'Projects',")
        expect(await listMigrations(projectPath)).toEqual(['001-create-projects', '002-update-projects'])
    })

    test('creates the migrations folder when the project has none', async () => {
        projectPath = await createTempProject()

        const migration = await scaffoldMigration(projectPath, {
            action: 'create',
            singular_label: 'Project',
            plural_label: 'Projects',
        })

        expect(migration.name).toBe('001-create-projects')
        expect(await readFile(migration.path, 'utf8')).toContain("plural_label: 'Projects',")
    })
})

describe('scaffoldMigration with the name the user confirmed', () => {
    test('writes that name even when the folder changed since', async () => {
        projectPath = await createTempProject()
        const planned = await planMigrationScaffold(projectPath, { action: 'update', module: 'Deals' })
        await scaffoldMigration(projectPath, { action: 'update', module: 'Leads' })

        const migration = await scaffoldMigration(
            projectPath,
            { action: 'update', module: 'Deals' },
            '002-update-deals'
        )

        expect(planned.name).toBe('001-update-deals')
        expect(migration.name).toBe('002-update-deals')
        expect(await listMigrations(projectPath)).toEqual(['001-update-leads', '002-update-deals'])
    })

    test('explains a name that is already taken', async () => {
        projectPath = await createTempProject()
        await scaffoldMigration(projectPath, { action: 'update', module: 'Deals' })

        await expect(
            scaffoldMigration(projectPath, { action: 'update', module: 'Deals' }, '001-update-deals')
        ).rejects.toThrow('Migration "001-update-deals" already exists')
    })
})

describe('the scaffolded file', () => {
    // The temp project cannot resolve the package, so the import is swapped for an identity function.
    async function loadScaffolded(scaffold: Parameters<typeof scaffoldMigration>[1]) {
        projectPath = await createTempProject()
        const migration = await scaffoldMigration(projectPath, scaffold)
        const source = await readFile(migration.path, 'utf8')
        await writeFile(
            migration.path,
            source.replace(/^import .*$/m, 'const defineMigration = (definition: unknown) => definition')
        )

        return (await loadMigration(projectPath, migration.name)).definition
    }

    test('a create migration is valid before any field is declared', async () => {
        const definition = await loadScaffolded({
            action: 'create',
            singular_label: "Client's Order",
            plural_label: "Clients' Orders",
        })

        expect(definition).not.toBeNull()
        expect(validateMigration(definition!)).toEqual([])
    })

    test('an update migration asks for at least one field', async () => {
        const definition = await loadScaffolded({ action: 'update', module: 'Deals' })

        expect(validateMigration(definition!)).toEqual(['An update must add at least one field.'])
    })
})

describe('planMigrationScaffold', () => {
    test('names the file without creating it', async () => {
        projectPath = await createTempProject()

        const planned = await planMigrationScaffold(projectPath, { action: 'update', module: 'Deals' })

        expect(planned.name).toBe('001-update-deals')
        expect(await listMigrations(projectPath)).toEqual([])
    })
})
