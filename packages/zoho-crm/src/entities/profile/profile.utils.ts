import type { ZohoProfile } from './profile.types'

/** Matches the name shown in the CRM first, so a migration can name a profile the way a person sees it. */
export function findProfileByName(profiles: ZohoProfile[], name: string): ZohoProfile {
    const profile =
        profiles.find((candidate) => candidate.name === name) ??
        profiles.find((candidate) => candidate.api_name === name)

    if (!profile) {
        const knownNames = profiles.map((candidate) => candidate.name).join(', ')

        throw new Error(`Zoho CRM has no profile named "${name}". Known profiles: ${knownNames}.`)
    }

    return profile
}
