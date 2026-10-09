/** Credentials and tokens are not here — they live in the store under `~/.zoho-studio`. */
export interface ProjectSettings {
    auth: {
        baseUrl: string
        scopes: string[]
    }
    api: {
        baseUrl: string
        version: string
    }
    logs: {
        /** The file every command logs to, relative to the project root. */
        file: string
    }
    /** The one Zoho Projects project the `z-projects:*` commands work with. */
    projects: {
        baseUrl: string
        portalId: string
        projectId: string
        /** Where `z-projects:tasks:render` writes; empty means `src/zoho-projects/md` inside the workspace. */
        mdPath: string
    }
    /** Named command sequences for `zoho-studio preset`; each entry is a command line without the binary name. */
    presets: Record<string, string[]>
}

/** The settings together with the project root they were found in. */
export interface ProjectContext {
    projectPath: string
    settings: ProjectSettings
}
