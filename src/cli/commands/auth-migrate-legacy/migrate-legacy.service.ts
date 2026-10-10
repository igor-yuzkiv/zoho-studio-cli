import { chmod } from 'node:fs/promises'
import { basename } from 'node:path'

import { resolveWorkspaceSettingsPath, workspaceSettingsRelativePath } from '@/config'
import { addProfile, listProfiles, readConnection, saveConnection } from '@/credentials'
import { clearProjectCache, findProjectPath } from '@/settings'
import { writeJsonFile } from '@/shared/utils'

import type { MigrateLegacyOptions, MigrateLegacyResult } from './migrate-legacy.types'

interface LegacyAuth {
    clientId?: string
    clientSecret?: string
    tokens?: { accessToken?: string; refreshToken?: string; accessTokenExpiresAt?: number }
    [key: string]: unknown
}

export async function migrateLegacyAuth(
    { chooseProfileName }: MigrateLegacyOptions,
    startPath: string = process.cwd()
): Promise<MigrateLegacyResult> {
    const projectPath = await findProjectPath(startPath)

    if (!projectPath) {
        throw new Error(`No ${workspaceSettingsRelativePath} found. Run the command inside a project.`)
    }

    // The raw file, not the merged settings: only what the user wrote is rewritten.
    const settingsPath = resolveWorkspaceSettingsPath(projectPath)
    const settings = (await Bun.file(settingsPath).json()) as { auth?: LegacyAuth; [key: string]: unknown }
    const { clientId, clientSecret, tokens, ...auth } = settings.auth ?? {}

    if (clientId === undefined && clientSecret === undefined && tokens === undefined) {
        return { status: 'nothing-to-migrate' }
    }

    if (!clientId || !clientSecret) {
        throw new Error(
            `${workspaceSettingsRelativePath} has no complete client to migrate. ` +
                'Remove auth.clientId, auth.clientSecret and auth.tokens from it and run "zoho-studio login".'
        )
    }

    const existing = (await listProfiles()).find((profile) => profile.clientId === clientId)
    const profile = existing?.name ?? (await chooseProfileName(basename(projectPath)))

    if (!existing) {
        await addProfile({ name: profile, clientId, clientSecret })
    }

    const storedConnection = await readConnection(projectPath)
    const tokensMoved = Boolean(tokens?.refreshToken) && !storedConnection

    if (tokensMoved) {
        await saveConnection(projectPath, {
            profile,
            accessToken: tokens?.accessToken ?? '',
            refreshToken: tokens!.refreshToken!,
            accessTokenExpiresAt: tokens?.accessTokenExpiresAt ?? 0,
        })
    }

    await writeJsonFile(settingsPath, { ...settings, auth })
    await chmod(settingsPath, 0o600)
    clearProjectCache()

    return {
        status: 'migrated',
        profile,
        profileCreated: !existing,
        tokensMoved,
        connectionProfile: tokensMoved ? profile : (storedConnection?.profile ?? null),
    }
}
