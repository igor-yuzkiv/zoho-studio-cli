import type { DelugeFunctionCategory } from '../../zoho-crm.config'

/** A function as Zoho returns it — the named fields are the ones the CLI relies on. */
export interface ZohoFunction {
    id: string
    name: string
    api_name: string
    category?: string
    [field: string]: unknown
}

export interface FunctionDeployment {
    /** ISO 8601, UTC. */
    date: string
    operation: 'create' | 'update'
    changelog: string
}

/**
 * `<api_name>.deploy.json` — what a deploy sends besides the code, and the local deployment history.
 * The return type and arguments are not here: Zoho reads them from the declaration in the code.
 */
export interface FunctionDeployMetadata {
    /** Zoho's id, absent until the first deploy creates the function. */
    id: string | null
    name: string
    api_name: string
    description: string
    runtime: string
    category: DelugeFunctionCategory
    deployments: FunctionDeployment[]
}
