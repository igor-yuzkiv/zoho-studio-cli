import { isAbsolute, resolve, sep } from 'node:path'

/**
 * A pull command wipes the directory it writes to, so a configured path that is absolute, escapes
 * the project, or resolves to the project root itself is refused instead of deleting something else.
 */
export function resolveProjectDirPath(projectPath: string, relativeDir: string, settingName: string): string {
    if (isAbsolute(relativeDir)) {
        throw new Error(`${settingName} must be relative to the project, got "${relativeDir}".`)
    }

    const projectRootPath = resolve(projectPath)
    const dirPath = resolve(projectRootPath, relativeDir)

    if (!dirPath.startsWith(projectRootPath + sep)) {
        throw new Error(`${settingName} must point inside the project, got "${relativeDir}".`)
    }

    return dirPath
}
