import { crmClient } from '@/shared/api/crm'

import type { ZohoGlobalPicklist } from '../global-picklist.types'

interface GlobalPicklistPayload {
    global_picklists?: ZohoGlobalPicklist[]
}

/**
 * Returns the full record of one global picklist — its values, which the list endpoint omits. Zoho
 * answers an unknown id with an empty 204 rather than an error, so that is reported here.
 */
export async function getGlobalPicklist(id: string): Promise<ZohoGlobalPicklist> {
    const { data } = await crmClient.get<GlobalPicklistPayload>(`/settings/global_picklists/${id}`)
    const globalPicklist = data?.global_picklists?.[0]

    if (!globalPicklist) {
        throw new Error(`Zoho CRM returned no global picklist for id "${id}".`)
    }

    return globalPicklist
}
