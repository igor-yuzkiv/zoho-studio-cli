import { mkdir, stat } from 'node:fs/promises'
import { join } from 'node:path'

import {
    projectSettingsFileName,
    projectSettingsGitignoreEntry,
    resolveProjectSettingsDirPath,
    resolveProjectSettingsPath,
} from '@/config'
import { defaultProjectSettings, saveProjectSettings } from '@/settings'

import type { GitignoreOutcome, InitializeProjectOptions, InitializeProjectResult } from './init.types'

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

    await saveProjectSettings(projectPath, defaultProjectSettings)

    return {
        projectPath,
        gitignoreOutcome: await ensureGitignoreEntry(projectPath, projectSettingsGitignoreEntry),
    }
}

async function assertPathIsNotAFile(path: string): Promise<void> {
    const pathStats = await statOrNull(path)

    if (pathStats && !pathStats.isDirectory()) {
        throw new Error(`Target path is not a directory: ${path}`)
    }
}

async function ensureGitignoreEntry(projectPath: string, entry: string): Promise<GitignoreOutcome> {
    const gitignorePath = join(projectPath, '.gitignore')
    const gitignoreFile = Bun.file(gitignorePath)
    const gitignoreExists = await gitignoreFile.exists()
    const existingContent = gitignoreExists ? await gitignoreFile.text() : ''

    if (existingContent.split('\n').some((line) => line.trim() === entry)) {
        return 'unchanged'
    }

    const separator = existingContent === '' || existingContent.endsWith('\n') ? '' : '\n'
    await Bun.write(gitignorePath, `${existingContent}${separator}${entry}\n`)

    return gitignoreExists ? 'updated' : 'created'
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
