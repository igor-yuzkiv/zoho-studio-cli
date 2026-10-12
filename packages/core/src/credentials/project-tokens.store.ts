import { resolve } from 'node:path'

import { resolveProjectTokensPath } from './credentials.config'
import type { ConnectionTokens, ProjectTokensFile } from './credentials.types'
import { readJsonOrNull, writeSecretJson } from './secret-file.utils'

export async function readConnection(projectPath: string): Promise<ConnectionTokens | null> {
    return (await readProjectTokens(projectPath))?.connections.default ?? null
}

export async function saveConnection(projectPath: string, tokens: ConnectionTokens): Promise<void> {
    const file: ProjectTokensFile = { projectPath: resolve(projectPath), connections: { default: tokens } }

    await writeSecretJson(resolveProjectTokensPath(projectPath), file)
}

async function readProjectTokens(projectPath: string): Promise<ProjectTokensFile | null> {
    const filePath = resolveProjectTokensPath(projectPath)
    const file = await readJsonOrNull<ProjectTokensFile>(filePath)

    if (file && file.projectPath !== resolve(projectPath)) {
        throw new Error(
            `${filePath} belongs to ${file.projectPath}, not ${resolve(projectPath)} — the two paths map to ` +
                'the same key. Move one of the projects, or delete that file and run "zoho-studio login".'
        )
    }

    return file
}
