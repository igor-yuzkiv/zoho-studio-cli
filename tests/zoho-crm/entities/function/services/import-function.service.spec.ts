import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { mkdir, mkdtemp, readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { functionSnapshotExists, importFunctionSource } from '@zoho-studio/zoho-crm/function'

let projectPath: string

beforeEach(async () => {
    projectPath = await mkdtemp(join(tmpdir(), 'zoho-studio-import-'))
})

afterEach(async () => {
    await rm(projectPath, { recursive: true, force: true })
})

const snapshotPath = (apiName: string) => join(projectPath, 'data', 'zoho-crm', 'functions', apiName)
const sourcePath = (apiName: string) => join(projectPath, 'src', 'zoho-crm', 'functions', apiName)

const refreshCode = 'void automation.refresh_pricing(Int program_id)\n{\n\tinfo program_id;\n}'

async function writeSnapshot(fields: Record<string, unknown>, code: string | null = refreshCode) {
    const metadata = {
        id: '6640142000053695173',
        name: 'Refresh Pricing',
        api_name: 'oz_wf_refresh_pricing',
        description: 'Recalculates prices',
        category: 'Automation',
        runtime: 'Deluge 1.0',
        source: 'crm',
        ...fields,
    }
    const folder = snapshotPath(metadata.api_name as string)
    await mkdir(folder, { recursive: true })
    await Bun.write(join(folder, `${metadata.name}.metadata.json`), JSON.stringify(metadata))

    if (code !== null) {
        await Bun.write(join(folder, `${metadata.name}.deluge`), code)
    }
}

describe('functionSnapshotExists', () => {
    test('answers whether a pull saved the function in data', async () => {
        await writeSnapshot({})

        expect(await functionSnapshotExists(projectPath, 'oz_wf_refresh_pricing')).toBe(true)
        expect(await functionSnapshotExists(projectPath, 'oz_wf_other')).toBe(false)
    })
})

describe('importFunctionSource', () => {
    test('treats a snapshot folder without a function record as no snapshot', async () => {
        await mkdir(snapshotPath('oz_wf_left_empty'), { recursive: true })

        expect(await functionSnapshotExists(projectPath, 'oz_wf_left_empty')).toBe(false)
    })

    test('refuses a snapshot folder holding two function records', async () => {
        await writeSnapshot({})
        await writeSnapshot({ name: 'Old Name' })

        await expect(importFunctionSource(projectPath, 'oz_wf_refresh_pricing')).rejects.toThrow(/more than one/)
    })

    test('does not take a declaration inside a block comment for the real one', async () => {
        await writeSnapshot({}, '/*\nvoid automation.refresh_pricing()\n*/\nvoid automation.renamed_later()\n{\n}')

        expect((await importFunctionSource(projectPath, 'oz_wf_refresh_pricing')).warnings).toHaveLength(1)
    })

    test('copies the code as it is and writes a deploy file bound to the CRM function', async () => {
        await writeSnapshot({})

        const result = await importFunctionSource(projectPath, 'oz_wf_refresh_pricing')

        const folder = sourcePath('oz_wf_refresh_pricing')
        expect(await Bun.file(join(folder, 'oz_wf_refresh_pricing.deluge')).text()).toBe(refreshCode)
        expect(await Bun.file(join(folder, 'oz_wf_refresh_pricing.deploy.json')).json()).toEqual({
            id: '6640142000053695173',
            name: 'Refresh Pricing',
            api_name: 'oz_wf_refresh_pricing',
            description: 'Recalculates prices',
            runtime: 'Deluge 1.0',
            category: 'Automation',
            deployments: [],
        })
        expect(result.warnings).toEqual([])
    })

    test('leaves the snapshot in data untouched', async () => {
        await writeSnapshot({})

        await importFunctionSource(projectPath, 'oz_wf_refresh_pricing')

        expect((await readdir(snapshotPath('oz_wf_refresh_pricing'))).sort()).toEqual([
            'Refresh Pricing.deluge',
            'Refresh Pricing.metadata.json',
        ])
    })

    test('writes an empty description when Zoho returned none', async () => {
        await writeSnapshot({ description: null })

        await importFunctionSource(projectPath, 'oz_wf_refresh_pricing')

        const deploy = await Bun.file(
            join(sourcePath('oz_wf_refresh_pricing'), 'oz_wf_refresh_pricing.deploy.json')
        ).json()
        expect(deploy.description).toBe('')
    })

    test('refuses a function that does not run on Deluge', async () => {
        await writeSnapshot({ runtime: 'NodeJS 22' })

        await expect(importFunctionSource(projectPath, 'oz_wf_refresh_pricing')).rejects.toThrow(/NodeJS 22/)
        expect(await Bun.file(sourcePath('oz_wf_refresh_pricing')).exists()).toBe(false)
    })

    test('refuses a function without one of the Deluge categories', async () => {
        await writeSnapshot({ category: undefined })

        await expect(importFunctionSource(projectPath, 'oz_wf_refresh_pricing')).rejects.toThrow(/category/)
    })

    test('refuses a snapshot without code', async () => {
        await writeSnapshot({}, null)

        await expect(importFunctionSource(projectPath, 'oz_wf_refresh_pricing')).rejects.toThrow(/code/)
    })

    test('refuses a function that already has source', async () => {
        await writeSnapshot({})
        await importFunctionSource(projectPath, 'oz_wf_refresh_pricing')

        await expect(importFunctionSource(projectPath, 'oz_wf_refresh_pricing')).rejects.toThrow(/already exists/)
    })

    test('warns when the declaration does not follow the name and category', async () => {
        await writeSnapshot({}, 'void automation.renamed_later()\n{\n}')

        const result = await importFunctionSource(projectPath, 'oz_wf_refresh_pricing')

        expect(result.warnings).toHaveLength(1)
        expect(result.warnings[0]).toContain('automation.refresh_pricing')
    })
})
