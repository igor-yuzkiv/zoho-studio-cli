import { AxiosError } from 'axios'

import { crmClient } from '../../../api'

import type { ZohoModuleCreate } from '../module.types'

interface ModuleCreateOutcome {
    code?: string
    message?: string
    details?: { id?: string }
}

interface CreateModulePayload {
    modules?: ModuleCreateOutcome[]
}

/**
 * Creates one custom module and returns its id. Zoho takes a single module per request and accepts
 * or rejects it as a whole, reporting the reason inside the `modules` list rather than at the top level.
 */
export async function createModuleRequest(module: ZohoModuleCreate): Promise<{ id: string }> {
    let outcome: ModuleCreateOutcome | undefined

    try {
        const { data } = await crmClient.post<CreateModulePayload>('/settings/modules', { modules: [module] })
        outcome = data?.modules?.[0]
    } catch (error) {
        const rejection = error instanceof AxiosError ? (error.response?.data as CreateModulePayload)?.modules?.[0] : undefined

        if (rejection?.message) {
            throw new Error(`${rejection.message} (${rejection.code})`, { cause: error })
        }

        throw error
    }

    if (!outcome?.details?.id) {
        throw new Error('Zoho CRM answered the module creation without the id of the new module.')
    }

    return { id: outcome.details.id }
}
