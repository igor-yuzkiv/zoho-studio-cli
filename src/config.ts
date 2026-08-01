import { join } from 'node:path'

export const projectSettingsDirName = '.zoho-studio'

// bunfig resolves a config file by base name, so the extension is kept separate.
export const projectSettingsBaseName = 'settings'
export const projectSettingsFileName = `${projectSettingsBaseName}.json`

export const projectSettingsRelativePath = `${projectSettingsDirName}/${projectSettingsFileName}`

/** The organization snapshot describes the project itself, so it sits next to the settings. */
export const projectOrganizationFileName = 'org.json'

export const projectOrganizationRelativePath = `${projectSettingsDirName}/${projectOrganizationFileName}`

/**
 * Every downloaded or generated artifact lives here. The layout is fixed rather than configurable
 * so that later features can rely on where things are.
 */
export const projectSourceDirName = 'src'

export const logsDirName = 'logs'

export const functionsDirName = 'functions'
export const modulesDirName = 'modules'
export const workflowsDirName = 'workflows'
export const workflowActionsDirName = 'workflow-actions'
export const fieldsDirName = 'fields'
export const webhooksDirName = 'webhooks'
export const globalPicklistsDirName = 'global-picklists'

/** Deluge sources are saved under this extension; map the editor to it rather than it to the editor. */
export const functionCodeExtension = 'deluge'

export function resolveProjectSettingsDirPath(projectPath: string): string {
    return join(projectPath, projectSettingsDirName)
}

export function resolveProjectSettingsPath(projectPath: string): string {
    return join(resolveProjectSettingsDirPath(projectPath), projectSettingsFileName)
}

export function resolveProjectOrganizationPath(projectPath: string): string {
    return join(resolveProjectSettingsDirPath(projectPath), projectOrganizationFileName)
}

export function resolveProjectSourcePath(projectPath: string): string {
    return join(projectPath, projectSourceDirName)
}
