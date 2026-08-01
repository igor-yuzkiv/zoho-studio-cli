import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { mkdtemp, rm, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { resolveProjectSettingsDirPath, resolveProjectSettingsPath } from '@/config'
import { initializeProject } from '@/commands/init'
import { clearProjectCache, defaultProjectSettings } from '@/settings'

let workingPath: string

beforeEach(async () => {
    clearProjectCache()
    workingPath = await mkdtemp(join(tmpdir(), 'zoho-studio-init-'))
})

afterEach(async () => {
    await rm(workingPath, { recursive: true, force: true })
})

function readTemplateFile(projectPath: string, relativePath: string): Promise<string> {
    return Bun.file(join(projectPath, relativePath)).text()
}

describe('initializeProject', () => {
    test('scaffolds the project tree and writes the settings', async () => {
        const result = await initializeProject(workingPath)

        expect(await Bun.file(resolveProjectSettingsPath(workingPath)).json()).toEqual(defaultProjectSettings)
        expect(await Bun.file(join(workingPath, 'src/.gitkeep')).exists()).toBe(true)
        expect(await readTemplateFile(workingPath, 'logs/.gitignore')).toBe('*.log\n')
        expect(await readTemplateFile(workingPath, '.zoho-studio/.gitignore')).toBe('settings.json\n')
        expect(result.templateFiles.every(({ outcome }) => outcome === 'created')).toBe(true)
    })

    test('keeps the settings readable by the owner only', async () => {
        await initializeProject(workingPath)

        const mode = (await stat(resolveProjectSettingsPath(workingPath))).mode & 0o777

        expect(mode).toBe(0o600)
    })

    test('creates a missing target folder', async () => {
        const projectPath = join(workingPath, 'my-app')

        await initializeProject(projectPath)

        expect(await Bun.file(resolveProjectSettingsPath(projectPath)).exists()).toBe(true)
    })

    test('leaves the root .gitignore alone', async () => {
        await initializeProject(workingPath)

        expect(await Bun.file(join(workingPath, '.gitignore')).exists()).toBe(false)
    })

    test('never overwrites a template file the user has edited', async () => {
        await initializeProject(workingPath)
        await Bun.write(join(workingPath, 'logs/.gitignore'), 'edited\n')

        const result = await initializeProject(workingPath, { force: true })

        expect(await readTemplateFile(workingPath, 'logs/.gitignore')).toBe('edited\n')
        expect(result.templateFiles).toContainEqual({ path: 'logs/.gitignore', outcome: 'skipped' })
    })

    test('restores a template file the user deleted', async () => {
        await initializeProject(workingPath)
        await rm(join(workingPath, 'logs/.gitignore'))

        const result = await initializeProject(workingPath, { force: true })

        expect(await readTemplateFile(workingPath, 'logs/.gitignore')).toBe('*.log\n')
        expect(result.templateFiles).toContainEqual({ path: 'logs/.gitignore', outcome: 'created' })
    })

    test('never deletes pulled artifacts, even when forced', async () => {
        await initializeProject(workingPath)
        const artifactPath = join(workingPath, 'src/functions/send_invoice/Send Invoice.deluge')
        await Bun.write(artifactPath, 'info "sent";')

        await initializeProject(workingPath, { force: true })

        expect(await Bun.file(artifactPath).text()).toBe('info "sent";')
    })

    test('fails on an already initialized folder', async () => {
        await initializeProject(workingPath)

        await expect(initializeProject(workingPath)).rejects.toThrow(/already exists.*--force/s)
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
