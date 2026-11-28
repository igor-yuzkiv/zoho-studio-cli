import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { mkdtemp, readdir, rm, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, relative } from 'node:path'

import { moveArtifactToRemoved, openArtifactSnapshot, writeArtifactJson, writeArtifactText } from '@zoho-studio/core'

let projectPath: string

beforeEach(async () => {
    projectPath = await mkdtemp(join(tmpdir(), 'zoho-studio-snapshot-'))
})

afterEach(async () => {
    await rm(projectPath, { recursive: true, force: true })
})

const dataPath = () => join(projectPath, 'data')

async function listFiles(dirPath: string): Promise<string[]> {
    const entries = await readdir(dirPath, { recursive: true, withFileTypes: true }).catch(() => [])

    return entries
        .filter((entry) => entry.isFile())
        .map((entry) => relative(dirPath, join(entry.parentPath, entry.name)))
        .sort()
}

describe('openArtifactSnapshot', () => {
    test('leaves a file whose content did not change untouched', async () => {
        await writeArtifactJson(projectPath, ['zoho-crm', 'webhooks', 'A.json'], { id: '1' })
        const filePath = join(dataPath(), 'zoho-crm/webhooks/A.json')
        const before = await stat(filePath)
        await Bun.sleep(10)

        const snapshot = await openArtifactSnapshot(projectPath, ['zoho-crm', 'webhooks'])
        await snapshot.writeJson(['zoho-crm', 'webhooks', 'A.json'], { id: '1' })
        const moved = await snapshot.close()

        expect(moved).toEqual([])
        expect((await stat(filePath)).mtimeMs).toBe(before.mtimeMs)
    })

    test('rewrites a file whose content changed', async () => {
        await writeArtifactJson(projectPath, ['zoho-crm', 'webhooks', 'A.json'], { id: '1' })

        const snapshot = await openArtifactSnapshot(projectPath, ['zoho-crm', 'webhooks'])
        await snapshot.writeJson(['zoho-crm', 'webhooks', 'A.json'], { id: '2' })
        await snapshot.close()

        expect(await Bun.file(join(dataPath(), 'zoho-crm/webhooks/A.json')).json()).toEqual({ id: '2' })
    })

    test('moves a file the pull did not write into data/.removed under the same path', async () => {
        await writeArtifactJson(projectPath, ['zoho-crm', 'webhooks', 'A.json'], { id: '1' })
        await writeArtifactJson(projectPath, ['zoho-crm', 'webhooks', 'Gone.json'], { id: '2' })

        const snapshot = await openArtifactSnapshot(projectPath, ['zoho-crm', 'webhooks'])
        await snapshot.writeJson(['zoho-crm', 'webhooks', 'A.json'], { id: '1' })
        const moved = await snapshot.close()

        expect(moved).toHaveLength(1)
        expect(moved[0]).toMatch(/^\.removed\/[^/]+\/zoho-crm\/webhooks\/Gone\.json$/)
        expect(await listFiles(join(dataPath(), 'zoho-crm/webhooks'))).toEqual(['A.json'])
        expect(await Bun.file(join(dataPath(), moved[0]!)).json()).toEqual({ id: '2' })
    })

    test('writes text and new files in nested folders', async () => {
        const snapshot = await openArtifactSnapshot(projectPath, ['zoho-crm', 'functions'])
        await snapshot.writeText(['zoho-crm', 'functions', 'ping', 'ping.deluge'], 'return "pong";')
        await snapshot.writeBytes(['zoho-crm', 'functions', 'ping', 'raw.bin'], new Uint8Array([1, 2]))
        await snapshot.close()

        expect(await listFiles(join(dataPath(), 'zoho-crm/functions'))).toEqual(['ping/ping.deluge', 'ping/raw.bin'])
    })

    test('removes the folders a move leaves empty', async () => {
        await writeArtifactText(projectPath, ['zoho-crm', 'functions', 'gone', 'gone.deluge'], 'x')

        const snapshot = await openArtifactSnapshot(projectPath, ['zoho-crm', 'functions'])
        await snapshot.close()

        expect(await readdir(join(dataPath(), 'zoho-crm/functions'))).toEqual([])
    })

    test('moves only the files it owns and reports the names of the others', async () => {
        await writeArtifactJson(projectPath, ['zoho-crm', 'workflows', 'L.json'], { module: { api_name: 'Leads' } })
        await writeArtifactJson(projectPath, ['zoho-crm', 'workflows', 'D.json'], { module: { api_name: 'Deals' } })

        const snapshot = await openArtifactSnapshot(projectPath, ['zoho-crm', 'workflows'], {
            owns: (record) => (record as { module?: { api_name?: string } } | null)?.module?.api_name === 'Leads',
        })
        const moved = await snapshot.close()

        expect(snapshot.keptFileNames).toEqual(new Set(['D.json']))
        expect(moved).toHaveLength(1)
        expect(await listFiles(join(dataPath(), 'zoho-crm/workflows'))).toEqual(['D.json'])
    })

    test('puts every move of one process into the same folder', async () => {
        await writeArtifactJson(projectPath, ['zoho-crm', 'webhooks', 'A.json'], {})
        await writeArtifactJson(projectPath, ['zoho-crm', 'profiles', 'B.json'], {})

        const first = await (await openArtifactSnapshot(projectPath, ['zoho-crm', 'webhooks'])).close()
        const second = await (await openArtifactSnapshot(projectPath, ['zoho-crm', 'profiles'])).close()

        expect(first[0]!.split('/')[1]).toBe(second[0]!.split('/')[1])
    })

    test('refuses to snapshot the whole data directory', async () => {
        await expect(openArtifactSnapshot(projectPath, [])).rejects.toThrow()
    })
})

describe('moveArtifactToRemoved', () => {
    test('moves a whole folder and reports its files', async () => {
        await writeArtifactJson(projectPath, ['zoho-crm', 'modules', 'Gone', 'Gone.json'], {})
        await writeArtifactJson(projectPath, ['zoho-crm', 'modules', 'Gone', 'fields', 'F.json'], {})

        const moved = await moveArtifactToRemoved(projectPath, ['zoho-crm', 'modules', 'Gone'])

        expect(moved.map((path) => path.split('/').slice(2).join('/')).sort()).toEqual([
            'zoho-crm/modules/Gone/Gone.json',
            'zoho-crm/modules/Gone/fields/F.json',
        ])
        expect(await readdir(join(dataPath(), 'zoho-crm/modules'))).toEqual([])
    })
})
