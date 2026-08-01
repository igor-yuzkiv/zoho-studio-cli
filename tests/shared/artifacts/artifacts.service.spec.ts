import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { mkdtemp, readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import {
    removeModuleArtifactFiles,
    replaceArtifactDir,
    resolveArtifactFileName,
    resolveArtifactPath,
    sortForStableFileNames,
    toPathSegment,
    writeArtifactJson,
    writeArtifactText,
} from '@/shared/artifacts'

let projectPath: string

beforeEach(async () => {
    projectPath = await mkdtemp(join(tmpdir(), 'zoho-studio-artifacts-'))
})

afterEach(async () => {
    await rm(projectPath, { recursive: true, force: true })
})

describe('toPathSegment', () => {
    test('replaces characters that cannot appear in a path segment', () => {
        expect(toPathSegment('crm/Leads')).toBe('crm_Leads')
        expect(toPathSegment('crm\\Leads')).toBe('crm_Leads')
    })

    test('refuses a segment that names nothing or climbs the tree', () => {
        expect(() => toPathSegment('')).toThrow(/cannot be used as a path segment/)
        expect(() => toPathSegment('   ')).toThrow(/cannot be used as a path segment/)
        expect(() => toPathSegment('.')).toThrow(/cannot be used as a path segment/)
        expect(() => toPathSegment('..')).toThrow(/cannot be used as a path segment/)
    })
})

describe('resolveArtifactPath', () => {
    test('resolves inside the project src directory', () => {
        expect(resolveArtifactPath(projectPath, ['functions', 'send_invoice'])).toBe(
            join(projectPath, 'src', 'functions', 'send_invoice')
        )
    })

    test('refuses a segment that is only a climb', () => {
        expect(() => resolveArtifactPath(projectPath, ['..', 'elsewhere'])).toThrow(/cannot be used/)
    })

    test('keeps a segment that looks like a path inside src', () => {
        expect(resolveArtifactPath(projectPath, ['../../etc'])).toBe(join(projectPath, 'src', '.._.._etc'))
        expect(resolveArtifactPath(projectPath, ['functions/../../etc'])).toBe(
            join(projectPath, 'src', 'functions_.._.._etc')
        )
    })
})

describe('replaceArtifactDir', () => {
    test('empties the directory and recreates it', async () => {
        await writeArtifactText(projectPath, ['functions', 'stale.json'], '{}')

        const dirPath = await replaceArtifactDir(projectPath, ['functions'])

        expect(await readdir(dirPath)).toEqual([])
    })

    test('refuses to replace the whole src directory', async () => {
        await expect(replaceArtifactDir(projectPath, [])).rejects.toThrow(/whole src directory/)
    })
})

describe('writeArtifactJson', () => {
    test('creates the parent directories and writes indented json', async () => {
        await writeArtifactJson(projectPath, ['modules', 'Leads', 'Leads.metadata.json'], { api_name: 'Leads' })

        expect(await Bun.file(join(projectPath, 'src', 'modules', 'Leads', 'Leads.metadata.json')).text()).toBe(
            '{\n    "api_name": "Leads"\n}\n'
        )
    })
})

describe('resolveArtifactFileName', () => {
    test('names the file after the record', () => {
        expect(resolveArtifactFileName('Big Deal Rule', '1', new Set())).toBe('Big Deal Rule.json')
    })

    test('keeps the file name a single path segment', () => {
        expect(resolveArtifactFileName('Deals/Won', '1', new Set())).toBe('Deals_Won.json')
    })

    test('adds the record id when the name is already taken', () => {
        expect(resolveArtifactFileName('Upsert', '2', new Set(['Upsert.json']))).toBe('Upsert.2.json')
    })

    test('falls back to the record id when the name leaves no usable file name', () => {
        expect(resolveArtifactFileName('..', '7', new Set())).toBe('7.json')
        expect(resolveArtifactFileName('   ', '7', new Set())).toBe('7.json')
    })
})

describe('removeModuleArtifactFiles', () => {
    async function writeRecordFile(fileName: string, record: unknown): Promise<void> {
        await Bun.write(join(projectPath, fileName), JSON.stringify(record))
    }

    test('drops only the records of the asked module and reports the surviving file names', async () => {
        await writeRecordFile('Deals Alert.json', { id: '1', name: 'Deals Alert', module: { api_name: 'Deals' } })
        await writeRecordFile('Leads Alert.json', { id: '2', name: 'Leads Alert', module: { api_name: 'Leads' } })

        expect(await removeModuleArtifactFiles(projectPath, 'Deals')).toEqual(new Set(['Leads Alert.json']))
        expect(await readdir(projectPath)).toEqual(['Leads Alert.json'])
    })

    test('leaves a file that cannot be read as a record alone', async () => {
        await Bun.write(join(projectPath, 'broken.json'), 'not json')
        await writeRecordFile('no-module.json', { id: '3', name: 'No Module' })

        expect(await removeModuleArtifactFiles(projectPath, 'Deals')).toEqual(
            new Set(['broken.json', 'no-module.json'])
        )
        expect((await readdir(projectPath)).sort()).toEqual(['broken.json', 'no-module.json'])
    })

    // The caller creates the directory before calling this, so an empty one is the smallest input.
    test('claims no file names when the directory is empty', async () => {
        expect(await removeModuleArtifactFiles(projectPath, 'Deals')).toEqual(new Set())
        expect(await readdir(projectPath)).toEqual([])
    })
})

describe('sortForStableFileNames', () => {
    test('orders by module, then name, then id so collisions resolve the same way each run', () => {
        const records = [
            { id: '9', name: 'Upsert', module: { api_name: 'Leads' } },
            { id: '3', name: 'Upsert', module: { api_name: 'Deals' } },
            { id: '1', name: 'Alert', module: { api_name: 'Deals' } },
        ]

        expect(sortForStableFileNames(records).map((record) => record.id)).toEqual(['1', '3', '9'])
    })

    test('orders a record that names no module first', () => {
        const records = [
            { id: '2', name: 'B', module: { api_name: 'Deals' } },
            { id: '1', name: 'A' },
        ]

        expect(sortForStableFileNames(records).map((record) => record.id)).toEqual(['1', '2'])
    })

    test('leaves the given list untouched', () => {
        const records = [
            { id: '2', name: 'B', module: { api_name: 'Deals' } },
            { id: '1', name: 'A', module: { api_name: 'Deals' } },
        ]

        sortForStableFileNames(records)

        expect(records.map((record) => record.id)).toEqual(['2', '1'])
    })
})
