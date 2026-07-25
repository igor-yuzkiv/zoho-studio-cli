import { join } from 'node:path'

export const projectSettingsDirName = '.zoho-studio'

// bunfig resolves a config file by base name, so the extension is kept separate.
export const projectSettingsBaseName = 'settings'
export const projectSettingsFileName = `${projectSettingsBaseName}.json`

// The file carries the client secret and the refresh token, so it never belongs in a commit.
export const projectSettingsGitignoreEntry = `${projectSettingsDirName}/${projectSettingsFileName}`

export function resolveProjectSettingsDirPath(projectPath: string): string {
    return join(projectPath, projectSettingsDirName)
}

export function resolveProjectSettingsPath(projectPath: string): string {
    return join(resolveProjectSettingsDirPath(projectPath), projectSettingsFileName)
}
