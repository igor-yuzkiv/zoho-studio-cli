import { crmClient } from '@/shared/api/crm'

import type { ZohoFunction } from '../function.types'

interface FunctionsListInfo {
    more_records?: boolean
    next_page_token?: string | null
}

interface FunctionsListPayload {
    functions?: ZohoFunction[]
    info?: FunctionsListInfo
}

export interface PageParams {
    per_page: number
    page?: number
    page_token?: string
}

const functionsPerPage = 200
const maxPages = 100

interface FunctionsPage {
    functions: ZohoFunction[]
    info: FunctionsListInfo
}

/** Returns a single page of functions together with the pagination Zoho reports for it. */
export async function getFunctionsPage(params: PageParams): Promise<FunctionsPage> {
    const { data } = await crmClient.get<FunctionsListPayload>('/settings/functions', { params })

    // A 204 answer leaves no payload at all, so an absent list simply means an empty page.
    return { functions: data?.functions ?? [], info: data?.info ?? {} }
}

/** Returns every function of the project, following the pagination Zoho reports in `info`. */
export async function getFunctionsList(): Promise<ZohoFunction[]> {
    const functions: ZohoFunction[] = []
    let params: PageParams = { per_page: functionsPerPage, page: 1 }

    for (let page = 0; page < maxPages; page += 1) {
        const currentPage = await getFunctionsPage(params)

        functions.push(...currentPage.functions)

        const nextParams = currentPage.info.more_records ? resolveNextPageParams(params, currentPage.info) : null

        if (!nextParams) {
            return functions
        }

        params = nextParams
    }

    throw new Error(`Zoho CRM kept reporting more functions after ${maxPages} pages.`)
}

/** Returns null when Zoho claims more records but offers no way to move forward. */
function resolveNextPageParams(current: PageParams, info: FunctionsListInfo): PageParams | null {
    const nextToken = info.next_page_token

    if (nextToken) {
        return nextToken === current.page_token ? null : { per_page: functionsPerPage, page_token: nextToken }
    }

    if (current.page_token) {
        return null
    }

    return { per_page: functionsPerPage, page: (current.page ?? 1) + 1 }
}
