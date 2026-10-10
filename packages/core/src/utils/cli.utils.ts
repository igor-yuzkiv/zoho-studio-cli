/**
 * A module option both narrows the request and decides which local files are dropped, so anything
 * but a plain module name is refused.
 */
export function assertModuleName(moduleName: string): string {
    if (!moduleName || moduleName === '.' || moduleName === '..' || /[/\\\0]/.test(moduleName)) {
        throw new Error(`--module must be a module API name, got "${moduleName}".`)
    }

    return moduleName
}
