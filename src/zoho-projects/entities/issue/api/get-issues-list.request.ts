import { getProjectsList } from '@/shared/api/projects'

import type { ZohoIssue } from '../issue.types'

/** Returns every issue of the configured project; the description comes with the list. */
export function getIssuesList(): Promise<ZohoIssue[]> {
    return getProjectsList<ZohoIssue>('issues', 'issues')
}
