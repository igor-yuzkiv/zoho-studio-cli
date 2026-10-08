import { getProjectsList } from '@/shared/api/projects'

import type { ZohoIssueComment } from '../issue.types'

/** Issue comments live under `bugs/`, Zoho's older name for the same entity; `issues/<id>/comments` answers 404. */
export function getIssueCommentsList(issueId: string): Promise<ZohoIssueComment[]> {
    return getProjectsList<ZohoIssueComment>(`bugs/${encodeURIComponent(issueId)}/comments`, 'comments')
}
