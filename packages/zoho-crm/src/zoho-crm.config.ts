/** Every CRM artifact sits under this folder inside `data/`, so another product's area can sit next to it. */
export const zohoCrmDirName = 'zoho-crm'

export const functionsDirName = 'functions'
export const modulesDirName = 'modules'
export const workflowsDirName = 'workflows'
export const workflowActionsDirName = 'workflow-actions'
export const fieldsDirName = 'fields'
export const webhooksDirName = 'webhooks'
export const globalPicklistsDirName = 'global-picklists'
export const profilesDirName = 'profiles'
export const layoutsDirName = 'layouts'

/** Deluge sources are saved under this extension; map the editor to it rather than it to the editor. */
export const functionCodeExtension = 'deluge'
export const clientScriptsDirName = 'client-scripts'

/** Client script pages that belong to no module, such as `commands`, are grouped under this folder. */
export const clientScriptsWithoutModuleDirName = '_no-module'
export const staticResourcesDirName = 'static-resources'

/** The only runtime `z-crm:functions:make` scaffolds for. */
export const delugeRuntime = 'Deluge 1.0'

/**
 * The return types Zoho accepts per category of a Deluge function; the first is the default.
 * Zoho rejects a declaration whose return type does not match its category.
 */
export const delugeReturnTypesByCategory = {
    Button: ['string'],
    Automation: ['void', 'string'],
    Schedule: ['void'],
    'Related List': ['string'],
    Standalone: ['string'],
    Signals: ['void'],
    'Validation Rule': ['map'],
} as const satisfies Record<string, readonly string[]>

export type DelugeFunctionCategory = keyof typeof delugeReturnTypesByCategory

export const delugeFunctionCategories = Object.keys(delugeReturnTypesByCategory) as DelugeFunctionCategory[]

export const functionDeployFileSuffix = 'deploy.json'
