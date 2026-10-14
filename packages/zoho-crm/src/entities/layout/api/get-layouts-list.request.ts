import { crmClient } from '../../../api'

import type { ZohoLayout } from '../layout.types'

interface LayoutsListPayload {
    layouts?: ZohoLayout[]
}

/**
 * Returns every layout of a module with its sections and their fields. `mode=all` adds the quick
 * create and business card sections, which the default mode leaves out.
 */
export async function getLayoutsListRequest(module: string): Promise<ZohoLayout[]> {
    const { data } = await crmClient.get<LayoutsListPayload>('/settings/layouts', { params: { module, mode: 'all' } })

    // A 204 answer leaves no payload at all, so an absent list simply means no layouts.
    return data?.layouts ?? []
}
