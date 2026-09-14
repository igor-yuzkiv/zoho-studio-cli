import { projectsClient } from './projects.client'

interface PageInfo {
    page?: number
    per_page?: number
    has_next_page?: boolean
}

const itemsPerPage = 200
const maxPages = 100

/**
 * Every Projects list answers `{ <key>: [...], page_info }`, so one loop serves them all: page by
 * page until Zoho says there is no next one.
 */
export async function getProjectsList<Item>(path: string, key: string): Promise<Item[]> {
    const items: Item[] = []

    for (let page = 1; page <= maxPages; page += 1) {
        const { data } = await projectsClient.get<Record<string, unknown>>(path, {
            params: { page, per_page: itemsPerPage },
        })
        const pageItems = data?.[key]
        const pageInfo = (data?.page_info ?? {}) as PageInfo

        items.push(...((Array.isArray(pageItems) ? pageItems : []) as Item[]))

        if (pageInfo.has_next_page !== true) {
            return items
        }
    }

    throw new Error(`Zoho Projects kept reporting a next page of "${path}" after ${maxPages} pages.`)
}
