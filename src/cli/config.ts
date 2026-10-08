import { join } from 'node:path'

export const workspaceSettingsDirName = '.zoho-studio'

// bunfig resolves a config file by base name, so the extension is kept separate.
export const workspaceSettingsBaseName = 'settings'
export const workspaceSettingsFileName = `${workspaceSettingsBaseName}.json`

export const workspaceSettingsRelativePath = `${workspaceSettingsDirName}/${workspaceSettingsFileName}`

/** The organization snapshot describes the project itself, so it sits next to the settings. */
export const workspaceOrganizationFileName = 'org.json'

export const workspaceOrganizationRelativePath = `${workspaceSettingsDirName}/${workspaceOrganizationFileName}`

/**
 * Every downloaded or generated artifact lives here. The layout is fixed rather than configurable
 * so that later features can rely on where things are.
 */
export const workspaceSourceDirName = 'src'

export const logsDirName = 'logs'

export function resolveWorkspaceSettingsDirPath(projectPath: string): string {
    return join(projectPath, workspaceSettingsDirName)
}

export function resolveWorkspaceSettingsPath(projectPath: string): string {
    return join(resolveWorkspaceSettingsDirPath(projectPath), workspaceSettingsFileName)
}

export function resolveWorkspaceOrganizationPath(projectPath: string): string {
    return join(resolveWorkspaceSettingsDirPath(projectPath), workspaceOrganizationFileName)
}

export function resolveWorkspaceSourcePath(projectPath: string): string {
    return join(projectPath, workspaceSourceDirName)
}
