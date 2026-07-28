import { crmClient } from '@/shared/api/crm'

import type { ZohoModule } from '../module.types'

interface ModulesListPayload {
    modules?: ZohoModule[]
}

/** Returns every module of the organization — the endpoint answers with the whole list at once. */
export async function getModulesList(): Promise<ZohoModule[]> {
    const { data } = await crmClient.get<ModulesListPayload>('/settings/modules')

    // A 204 answer leaves no payload at all, so an absent list simply means no modules.
    return data?.modules ?? []
}
