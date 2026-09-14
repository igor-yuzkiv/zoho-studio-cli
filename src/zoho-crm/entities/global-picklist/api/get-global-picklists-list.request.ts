import { crmClient } from '@/shared/api/crm'

import type { ZohoGlobalPicklist } from '../global-picklist.types'

interface GlobalPicklistsListInfo {
    more_records?: boolean
}

interface GlobalPicklistsListPayload {
    global_picklists?: ZohoGlobalPicklist[]
    info?: GlobalPicklistsListInfo
}

export interface GlobalPicklistsPageParams {
    per_page: number
    page: number
}

const globalPicklistsPerPage = 200
const maxPages = 100

interface GlobalPicklistsPage {
    globalPicklists: ZohoGlobalPicklist[]
    info: GlobalPicklistsListInfo
}

/** Returns a single page of global picklists together with the pagination Zoho reports for it. */
export async function getGlobalPicklistsPage(params: GlobalPicklistsPageParams): Promise<GlobalPicklistsPage> {
    const { data } = await crmClient.get<GlobalPicklistsListPayload>('/settings/global_picklists', { params })

    // A 204 answer leaves no payload at all, so an absent list simply means an empty page.
    return { globalPicklists: data?.global_picklists ?? [], info: data?.info ?? {} }
}

/**
 * Returns every global picklist of the organization. Zoho paginates this endpoint by page number
 * only — it reports no page token, so there is nothing else to follow.
 */
export async function getGlobalPicklistsList(): Promise<ZohoGlobalPicklist[]> {
    const globalPicklists: ZohoGlobalPicklist[] = []

    for (let page = 1; page <= maxPages; page += 1) {
        const currentPage = await getGlobalPicklistsPage({ per_page: globalPicklistsPerPage, page })

        globalPicklists.push(...currentPage.globalPicklists)

        if (!currentPage.info.more_records) {
            return globalPicklists
        }
    }

    throw new Error(`Zoho CRM kept reporting more global picklists after ${maxPages} pages.`)
}
