import type { ZohoGlobalPicklist } from './global-picklist.types'

/** Ordered so that a name collision is always resolved the same way between runs. */
export function sortGlobalPicklists(globalPicklists: ZohoGlobalPicklist[]): ZohoGlobalPicklist[] {
    return [...globalPicklists].sort(
        (left, right) => left.api_name.localeCompare(right.api_name) || left.id.localeCompare(right.id)
    )
}
