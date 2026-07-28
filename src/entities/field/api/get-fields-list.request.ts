import { crmClient } from '@/shared/api/crm'

import type { ZohoField } from '../field.types'

interface FieldsListInfo {
    more_records?: boolean
    next_page_token?: string | null
}

interface FieldsListPayload {
    fields?: ZohoField[]
    info?: FieldsListInfo
}

export interface FieldsPageParams {
    module: string
    per_page: number
    page?: number
    page_token?: string
}

const fieldsPerPage = 200
const maxPages = 100

interface FieldsPage {
    fields: ZohoField[]
    info: FieldsListInfo
}

/** Returns a single page of module fields together with the pagination Zoho reports for it. */
export async function getFieldsPage(params: FieldsPageParams): Promise<FieldsPage> {
    const { data } = await crmClient.get<FieldsListPayload>('/settings/fields', { params })

    // A 204 answer leaves no payload at all, so an absent list simply means an empty page.
    return { fields: data?.fields ?? [], info: data?.info ?? {} }
}

/** Returns every field of a module, following the pagination Zoho reports in `info`. */
export async function getFieldsList(module: string): Promise<ZohoField[]> {
    const fields: ZohoField[] = []
    let params: FieldsPageParams = { module, per_page: fieldsPerPage, page: 1 }

    for (let page = 0; page < maxPages; page += 1) {
        const currentPage = await getFieldsPage(params)

        fields.push(...currentPage.fields)

        const nextParams = currentPage.info.more_records ? resolveNextPageParams(params, currentPage.info) : null

        if (!nextParams) {
            return fields
        }

        params = nextParams
    }

    throw new Error(`Zoho CRM kept reporting more fields of "${module}" after ${maxPages} pages.`)
}

/** Returns null when Zoho claims more records but offers no way to move forward. */
function resolveNextPageParams(current: FieldsPageParams, info: FieldsListInfo): FieldsPageParams | null {
    const nextToken = info.next_page_token

    if (nextToken) {
        return nextToken === current.page_token
            ? null
            : { module: current.module, per_page: fieldsPerPage, page_token: nextToken }
    }

    if (current.page_token) {
        return null
    }

    return { module: current.module, per_page: fieldsPerPage, page: (current.page ?? 1) + 1 }
}
