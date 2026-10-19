import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { mkdir, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { listRunnableFunctions, readFunctionRunSource } from '@zoho-studio/zoho-crm/function'

let projectPath: string

beforeEach(async () => {
    projectPath = await mkdtemp(join(tmpdir(), 'zoho-studio-run-'))
})

afterEach(async () => {
    await rm(projectPath, { recursive: true, force: true })
})

async function writeSource(apiName: string, files: Record<string, string>, root = 'src') {
    const folder = join(projectPath, root, 'zoho-crm', 'functions', apiName)
    await mkdir(folder, { recursive: true })

    for (const [name, content] of Object.entries(files)) {
        await Bun.write(join(folder, name), content)
    }
}

describe('listRunnableFunctions', () => {
    test('lists the folders of src/ that have a deploy file, sorted', async () => {
        await writeSource('sa_ping', { 'sa_ping.deluge': '', 'sa_ping.deploy.json': '{}' })
        await writeSource('btn_send', { 'btn_send.deluge': '', 'btn_send.deploy.json': '{}' })
        await writeSource('leftover', { 'notes.txt': '' })

        expect(await listRunnableFunctions(projectPath, 'src')).toEqual(['btn_send', 'sa_ping'])
    })

    test('lists the functions pulled into data/ for a run from data', async () => {
        await writeSource('wf_sync', { 'Sync.metadata.json': '{}', 'Sync.deluge': '' }, 'data')
        await writeSource('sa_ping', { 'sa_ping.deluge': '', 'sa_ping.deploy.json': '{}' })

        expect(await listRunnableFunctions(projectPath, 'data')).toEqual(['wf_sync'])
    })

    test('lists nothing when there are no functions', async () => {
        expect(await listRunnableFunctions(projectPath, 'src')).toEqual([])
        expect(await listRunnableFunctions(projectPath, 'data')).toEqual([])
    })
})

describe('readFunctionRunSource', () => {
    test('reads the code and the arguments it declares', async () => {
        const code = 'string button.btn_send(String id)\n{\n\treturn id;\n}'
        await writeSource('btn_send', { 'btn_send.deluge': code, 'btn_send.deploy.json': '{}' })

        expect(await readFunctionRunSource(projectPath, 'btn_send', 'src')).toEqual({
            apiName: 'btn_send',
            origin: 'src',
            code,
            parameters: [{ type: 'String', name: 'id' }],
        })
    })

    test('points at make and import when the function is not in src/', async () => {
        await expect(readFunctionRunSource(projectPath, 'btn_missing', 'src')).rejects.toThrow(
            'Create it with "zoho-studio z-crm:functions:make" or import it with "zoho-studio z-crm:functions:import".'
        )
    })

    test('reads the pulled code of a run from data', async () => {
        const code = 'void automation.sync(Int program_id)\n{\n}'
        const metadata = { id: '1', name: 'Sync', api_name: 'wf_sync', category: 'Automation', runtime: 'Deluge 1.0' }
        await writeSource('wf_sync', { 'Sync.metadata.json': JSON.stringify(metadata), 'Sync.deluge': code }, 'data')

        expect(await readFunctionRunSource(projectPath, 'wf_sync', 'data')).toEqual({
            apiName: 'wf_sync',
            origin: 'data',
            code,
            parameters: [{ type: 'Int', name: 'program_id' }],
        })
    })

    test('points at pull when the function is not in data/', async () => {
        await expect(readFunctionRunSource(projectPath, 'wf_missing', 'data')).rejects.toThrow(
            'Run "zoho-studio z-crm:functions:pull" first.'
        )
    })
})
