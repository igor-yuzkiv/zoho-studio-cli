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
    test('creates a dated migration file, which the migrate list shows after the numbered ones', async () => {
        projectPath = await createTempProject()
        const migrationsPath = join(projectPath, 'migrations', 'zoho-crm')
        await mkdir(migrationsPath, { recursive: true })
        await writeFile(join(migrationsPath, '001-create-projects.ts'), '')

        const migration = await scaffoldMigration(projectPath, { action: 'update', module: 'Projects' })

        expect(migration.name).toMatch(/^\d{4}_\d{2}_\d{2}_\d{6}_update_projects$/)
        expect(relative(projectPath, migration.path)).toBe(`migrations/zoho-crm/${migration.name}.ts`)
        expect(await readFile(migration.path, 'utf8')).toContain("module: 'Projects',")
        expect(await listMigrations(projectPath)).toEqual(['001-create-projects', migration.name])
    })

    test('creates the migrations folder when the project has none', async () => {
        projectPath = await createTempProject()

        const migration = await scaffoldMigration(projectPath, {
            action: 'create',
            singular_label: 'Project',
            plural_label: 'Projects',
        })

        expect(await readFile(migration.path, 'utf8')).toContain("plural_label: 'Projects',")
    })

    test('writes the name the user confirmed', async () => {
        projectPath = await createTempProject()
        const planned = planMigrationScaffold(
            projectPath,
            { action: 'update', module: 'Deals' },
            new Date(2026, 9, 19, 14, 30, 5)
        )

        const migration = await scaffoldMigration(projectPath, { action: 'update', module: 'Deals' }, planned.name)

        expect(migration).toEqual(planned)
        expect(await listMigrations(projectPath)).toEqual(['2026_10_19_143005_update_deals'])
    })

    test('explains a name that is already taken', async () => {
        projectPath = await createTempProject()
        const name = '2026_10_19_143005_update_deals'
        await scaffoldMigration(projectPath, { action: 'update', module: 'Deals' }, name)

        await expect(scaffoldMigration(projectPath, { action: 'update', module: 'Deals' }, name)).rejects.toThrow(
            `Migration "${name}" already exists`
        )
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

        const planned = planMigrationScaffold(
            projectPath,
            { action: 'update', module: 'Deals' },
            new Date(2026, 9, 19, 14, 30, 5)
        )

        expect(planned.name).toBe('2026_10_19_143005_update_deals')
        expect(await listMigrations(projectPath)).toEqual([])
    })
})
