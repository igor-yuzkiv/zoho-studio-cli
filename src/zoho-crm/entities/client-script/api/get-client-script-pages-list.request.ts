import { crmClient } from '@/shared/api/crm'

import type { ClientScriptPage } from '../client-script.types'

interface ClientScriptPagesPayload {
    client_script_pages?: ClientScriptPage[]
}

/** Returns every client script page of the organization; Zoho answers them in one unpaged list. */
export async function getClientScriptPagesList(): Promise<ClientScriptPage[]> {
    const { data } = await crmClient.get<ClientScriptPagesPayload>('/settings/client_script_pages')

    return data?.client_script_pages ?? []
}
