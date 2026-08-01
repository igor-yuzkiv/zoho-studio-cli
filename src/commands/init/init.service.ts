import { mkdir, stat } from 'node:fs/promises'
import { dirname, join } from 'node:path'

import { projectSettingsFileName, resolveProjectSettingsDirPath, resolveProjectSettingsPath } from '@/config'
import { defaultProjectSettings, saveProjectSettings } from '@/settings'

import { templateFiles } from './template.manifest'
import type { InitializeProjectOptions, InitializeProjectResult, TemplateFileResult } from './init.types'

export async function initializeProject(
    projectPath: string,
    { force = false }: InitializeProjectOptions = {}
): Promise<InitializeProjectResult> {
    await assertPathIsNotAFile(projectPath)
    await mkdir(projectPath, { recursive: true })
    await assertPathIsNotAFile(resolveProjectSettingsDirPath(projectPath))

    if ((await Bun.file(resolveProjectSettingsPath(projectPath)).exists()) && !force) {
        throw new Error(
            `${projectSettingsFileName} already exists in ${projectPath}. ` +
                'Re-run with --force to reset it, discarding the stored credentials and tokens.'
        )
    }

    const copied = await copyTemplateFiles(projectPath)

    await saveProjectSettings(projectPath, defaultProjectSettings)

    return { templateFiles: copied }
}

/**
 * An existing file is never overwritten, with or without `--force`: the user owns everything the
 * template handed them, and the pulled artifacts live in the same tree.
 */
async function copyTemplateFiles(projectPath: string): Promise<TemplateFileResult[]> {
    const results: TemplateFileResult[] = []

    for (const { embeddedPath, destination } of templateFiles) {
        const targetPath = join(projectPath, destination)

        if (await Bun.file(targetPath).exists()) {
            results.push({ path: destination, outcome: 'skipped' })
            continue
        }

        await mkdir(dirname(targetPath), { recursive: true })
        await Bun.write(targetPath, Bun.file(embeddedPath))

        results.push({ path: destination, outcome: 'created' })
    }

    return results
}

async function assertPathIsNotAFile(path: string): Promise<void> {
    const pathStats = await statOrNull(path)

    if (pathStats && !pathStats.isDirectory()) {
        throw new Error(`Target path is not a directory: ${path}`)
    }
}

async function statOrNull(path: string) {
    try {
        return await stat(path)
    } catch (error) {
        if ((error as { code?: string }).code === 'ENOENT') {
            return null
        }

        throw error
    }
}
