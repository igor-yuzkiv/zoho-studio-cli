import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { mkdtemp, readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import {
    replaceArtifactDir,
    resolveArtifactPath,
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
