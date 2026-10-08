import { crmClient } from '@/shared/api/crm'

import type { ClientScript } from '../client-script.types'

interface ClientScriptsPayload {
    client_scripts?: ClientScript[]
}

/** Returns the client scripts of one page; Zoho refuses the list without a page. */
export async function getClientScriptsList(pageId: string): Promise<ClientScript[]> {
    const { data } = await crmClient.get<ClientScriptsPayload>('/settings/client_scripts', {
        params: { client_script_page_id: pageId },
    })

    // A 204 answer leaves no payload at all, so an absent list simply means a page without scripts.
    return data?.client_scripts ?? []
}
