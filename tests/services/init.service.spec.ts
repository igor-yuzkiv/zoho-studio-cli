import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import {
    projectSettingsGitignoreEntry,
    resolveProjectSettingsDirPath,
    resolveProjectSettingsPath,
} from '@/config'
import { initializeProject } from '@/services/init'
import { clearProjectCache, defaultProjectSettings } from '@/settings'

let workingPath: string

beforeEach(async () => {
    clearProjectCache()
    workingPath = await mkdtemp(join(tmpdir(), 'zoho-studio-init-'))
})

afterEach(async () => {
    await rm(workingPath, { recursive: true, force: true })
})

function readGitignore(projectPath: string): Promise<string> {
    return Bun.file(join(projectPath, '.gitignore')).text()
}

describe('initializeProject', () => {
    test('creates settings.json and the gitignore entry', async () => {
        const result = await initializeProject(workingPath)

        expect(await Bun.file(resolveProjectSettingsPath(workingPath)).json()).toEqual(defaultProjectSettings)
        expect(await readGitignore(workingPath)).toBe(`${projectSettingsGitignoreEntry}\n`)
        expect(result).toEqual({ projectPath: workingPath, gitignoreOutcome: 'created' })
    })

    test('creates a missing target folder', async () => {
        const projectPath = join(workingPath, 'my-app')

        await initializeProject(projectPath)

        expect(await Bun.file(resolveProjectSettingsPath(projectPath)).exists()).toBe(true)
    })

    test('appends to an existing .gitignore instead of overwriting it', async () => {
        const gitignorePath = join(workingPath, '.gitignore')
        await Bun.write(gitignorePath, 'node_modules\n')

        const result = await initializeProject(workingPath)

        expect(await readGitignore(workingPath)).toBe(`node_modules\n${projectSettingsGitignoreEntry}\n`)
        expect(result.gitignoreOutcome).toBe('updated')
    })

    test('appends to an existing .gitignore that lacks a trailing newline', async () => {
        await Bun.write(join(workingPath, '.gitignore'), 'node_modules')

        await initializeProject(workingPath)

        expect(await readGitignore(workingPath)).toBe(`node_modules\n${projectSettingsGitignoreEntry}\n`)
    })

    test('does not duplicate the gitignore entry on a forced re-init', async () => {
        await initializeProject(workingPath)

        const result = await initializeProject(workingPath, { force: true })

        expect(await readGitignore(workingPath)).toBe(`${projectSettingsGitignoreEntry}\n`)
        expect(result.gitignoreOutcome).toBe('unchanged')
    })

    test('fails on an already initialized folder', async () => {
        await initializeProject(workingPath)

        await expect(initializeProject(workingPath)).rejects.toThrow(/already exists.*--force/s)
    })

    test('reports an existing empty .gitignore as updated', async () => {
        await Bun.write(join(workingPath, '.gitignore'), '')

        expect((await initializeProject(workingPath)).gitignoreOutcome).toBe('updated')
    })

    test('fails when .zoho-studio exists as a file', async () => {
        await Bun.write(resolveProjectSettingsDirPath(workingPath), 'content')

        await expect(initializeProject(workingPath)).rejects.toThrow(/not a directory/)
    })

    test('resets settings.json to the defaults when forced', async () => {
        await Bun.write(
            resolveProjectSettingsPath(workingPath),
            JSON.stringify({ api: { version: 'stale' }, auth: { clientId: '1000.CLIENT' } })
        )

        await initializeProject(workingPath, { force: true })

        expect(await Bun.file(resolveProjectSettingsPath(workingPath)).json()).toEqual(defaultProjectSettings)
    })

    test('fails when the target path is a file', async () => {
        const filePath = join(workingPath, 'not-a-folder')
        await Bun.write(filePath, 'content')

        await expect(initializeProject(filePath)).rejects.toThrow(/not a directory/)
    })
})
