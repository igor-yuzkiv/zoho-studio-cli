import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import {
    isRecordOfModule,
    resolveArtifactFileName,
    resolveArtifactPath,
    resolveSourcePath,
    sortForStableFileNames,
    toPathSegment,
    writeArtifactJson,
} from '@zoho-studio/core'

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
    test('resolves inside the project data directory', () => {
        expect(resolveArtifactPath(projectPath, ['functions', 'send_invoice'])).toBe(
            join(projectPath, 'data', 'functions', 'send_invoice')
        )
    })

    test('refuses a segment that is only a climb', () => {
        expect(() => resolveArtifactPath(projectPath, ['..', 'elsewhere'])).toThrow(/cannot be used/)
    })

    test('keeps a segment that looks like a path inside data', () => {
        expect(resolveArtifactPath(projectPath, ['../../etc'])).toBe(join(projectPath, 'data', '.._.._etc'))
        expect(resolveArtifactPath(projectPath, ['functions/../../etc'])).toBe(
            join(projectPath, 'data', 'functions_.._.._etc')
        )
    })
})

describe('writeArtifactJson', () => {
    test('creates the parent directories and writes indented json', async () => {
        await writeArtifactJson(projectPath, ['modules', 'Leads', 'Leads.metadata.json'], { api_name: 'Leads' })

        expect(await Bun.file(join(projectPath, 'data', 'modules', 'Leads', 'Leads.metadata.json')).text()).toBe(
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

describe('isRecordOfModule', () => {
    test('matches a record of the asked module', () => {
        expect(isRecordOfModule({ module: { api_name: 'Deals' } }, 'Deals')).toBe(true)
        expect(isRecordOfModule({ module: { api_name: 'Leads' } }, 'Deals')).toBe(false)
    })

    test('treats a record without a module, or no record at all, as foreign', () => {
        expect(isRecordOfModule({ id: '3' }, 'Deals')).toBe(false)
        expect(isRecordOfModule(null, 'Deals')).toBe(false)
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

describe('resolveSourcePath', () => {
    test('resolves inside the project src directory', () => {
        expect(resolveSourcePath(projectPath, ['zoho-crm', 'functions', 'oz_sa_ping'])).toBe(
            join(projectPath, 'src', 'zoho-crm', 'functions', 'oz_sa_ping')
        )
    })

    test('keeps a segment that looks like a path inside src', () => {
        expect(resolveSourcePath(projectPath, ['../../etc'])).toBe(join(projectPath, 'src', '.._.._etc'))
    })
})
