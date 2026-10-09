import { homedir } from 'node:os'
import { join, resolve } from 'node:path'

/** Overrides the store root, so tests and unusual setups never touch the real home folder. */
export const credentialsHomeEnvName = 'ZOHO_STUDIO_HOME'

export const credentialsHomeDirName = '.zoho-studio'
export const profilesFileName = 'profiles.json'
export const projectsDirName = 'projects'
export const projectTokensFileName = 'tokens.json'

export function resolveCredentialsHome(): string {
    return process.env[credentialsHomeEnvName] || join(homedir(), credentialsHomeDirName)
}

export function resolveProfilesPath(): string {
    return join(resolveCredentialsHome(), profilesFileName)
}

/** Mirrors how Claude Code names its project folders: `/home/u/x` becomes `-home-u-x`. */
export function encodeProjectKey(projectPath: string): string {
    return resolve(projectPath).replace(/[\\/]/g, '-')
}

export function resolveProjectTokensPath(projectPath: string): string {
    return join(resolveCredentialsHome(), projectsDirName, encodeProjectKey(projectPath), projectTokensFileName)
}
