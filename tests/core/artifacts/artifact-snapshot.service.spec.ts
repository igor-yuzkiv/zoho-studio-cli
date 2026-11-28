import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { access, mkdtemp, readdir, rm, stat } from 'node:fs/promises'
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

/** macOS file systems ignore case by default, Linux ones do not; the expected result differs. */
async function isCaseInsensitive(dirPath: string): Promise<boolean> {
    await Bun.write(join(dirPath, 'CaseProbe'), '')
    const insensitive = await access(join(dirPath, 'caseprobe')).then(
        () => true,
        () => false
    )
    await rm(join(dirPath, 'CaseProbe'))

    return insensitive
}

describe('openArtifactSnapshot', () => {
    test('keeps a file the pull could not fetch this time', async () => {
        await writeArtifactText(projectPath, ['zoho-crm', 'functions', 'f', 'F.deluge'], 'old code')

        const snapshot = await openArtifactSnapshot(projectPath, ['zoho-crm', 'functions'])
        snapshot.keep(['zoho-crm', 'functions', 'f', 'F.deluge'])
        const moved = await snapshot.close()

        expect(moved).toEqual([])
        expect(await Bun.file(join(dataPath(), 'zoho-crm/functions/f/F.deluge')).text()).toBe('old code')
    })

    test('keeps every file under a kept folder', async () => {
        await writeArtifactJson(projectPath, ['zoho-crm', 'client-scripts', 'Deals', 'page', 'S.1', 'S.metadata.json'], {})
        await writeArtifactText(projectPath, ['zoho-crm', 'client-scripts', 'Deals', 'page', 'S.1', 'S.js'], 'x')
        await writeArtifactText(projectPath, ['zoho-crm', 'client-scripts', 'Deals', 'pageTwo', 'T.js'], 'y')

        const snapshot = await openArtifactSnapshot(projectPath, ['zoho-crm', 'client-scripts'])
        snapshot.keep(['zoho-crm', 'client-scripts', 'Deals', 'page'])
        const moved = await snapshot.close()

        expect(moved.map((path) => path.split('/').slice(2).join('/'))).toEqual([
            'zoho-crm/client-scripts/Deals/pageTwo/T.js',
        ])
        expect(await listFiles(join(dataPath(), 'zoho-crm/client-scripts'))).toEqual([
            'Deals/page/S.1/S.js',
            'Deals/page/S.1/S.metadata.json',
        ])
    })

    test('keeps the content written under a name that differs only in case', async () => {
        await writeArtifactText(projectPath, ['zoho-crm', 'functions', 'f', 'Send invoice.deluge'], 'old')
        const insensitive = await isCaseInsensitive(join(dataPath(), 'zoho-crm/functions/f'))

        const snapshot = await openArtifactSnapshot(projectPath, ['zoho-crm', 'functions'])
        await snapshot.writeText(['zoho-crm', 'functions', 'f', 'Send Invoice.deluge'], 'new')
        const moved = await snapshot.close()

        const files = await listFiles(join(dataPath(), 'zoho-crm/functions'))

        if (insensitive) {
            expect(moved).toEqual([])
            expect(files).toHaveLength(1)
            expect(await Bun.file(join(dataPath(), 'zoho-crm/functions/f', files[0]!.split('/')[1]!)).text()).toBe('new')
        } else {
            expect(moved).toHaveLength(1)
            expect(files).toEqual(['f/Send Invoice.deluge'])
        }
    })

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
