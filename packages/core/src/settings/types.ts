/** Credentials and tokens are not here — they live in the store under `~/.zoho-studio`. */
export interface ProjectSettings {
    auth: {
        baseUrl: string
        /** What `login` asks Zoho for. */
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
    /** Named command sequences for `zoho-studio preset`; each entry is a command line without the binary name. */
    presets: Record<string, string[]>
    zohoCrm: {
        functions: {
            /** How `z-crm:functions:make` proposes an API name: `<vendor>_<category prefix>_<module>_<purpose>`. */
            naming: {
                enabled: boolean
                /** Left out of the name when empty. */
                vendor: string
                /** Keyed by Zoho category name; a category without an entry is spelled out in snake case. */
                categoryPrefixes: Record<string, string>
            }
        }
    }
}

/** The settings together with the project root they were found in. */
export interface ProjectContext {
    projectPath: string
    settings: ProjectSettings
}
