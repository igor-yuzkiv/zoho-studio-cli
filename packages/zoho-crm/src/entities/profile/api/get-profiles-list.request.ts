import { crmClient } from '../../../api'

import type { ZohoProfile } from '../profile.types'

interface ProfilesListPayload {
    profiles?: ZohoProfile[]
    info?: { more_records?: boolean }
}

const profilesPerPage = 200
const maxPages = 100

/** Returns every profile of the organization, following Zoho's page-number pagination. */
export async function getProfilesList(): Promise<ZohoProfile[]> {
    const profiles: ZohoProfile[] = []

    for (let page = 1; page <= maxPages; page += 1) {
        const { data } = await crmClient.get<ProfilesListPayload>('/settings/profiles', {
            params: { per_page: profilesPerPage, page },
        })

        // A 204 answer leaves no payload at all, so an absent list simply means no profiles.
        profiles.push(...(data?.profiles ?? []))

        if (!data?.info?.more_records) {
            return profiles
        }
    }

    throw new Error(`Zoho CRM kept reporting more profiles after ${maxPages} pages.`)
}
