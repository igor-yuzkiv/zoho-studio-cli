import { crmClient } from '@/shared/api/crm'

import type { StaticResource } from '../static-resource.types'

interface StaticResourcesPayload {
    static_resources?: StaticResource[]
    info?: { more_records?: boolean }
}

const staticResourcesPerPage = 200
const maxPages = 100

/** Returns every static resource of the organization, Zoho's own libraries included. */
export async function getStaticResourcesList(): Promise<StaticResource[]> {
    const resources: StaticResource[] = []

    for (let page = 1; page <= maxPages; page += 1) {
        const { data } = await crmClient.get<StaticResourcesPayload>('/settings/static_resources', {
            params: { page, per_page: staticResourcesPerPage },
        })

        // A 204 answer leaves no payload at all, so an absent list simply means an empty page.
        resources.push(...(data?.static_resources ?? []))

        if (!data?.info?.more_records) {
            return resources
        }
    }

    throw new Error(`Zoho CRM kept reporting more static resources after ${maxPages} pages.`)
}
