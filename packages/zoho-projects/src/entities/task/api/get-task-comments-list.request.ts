import { getProjectsList } from '../../../api'

import type { ZohoTaskComment } from '../task.types'

export function getTaskCommentsList(taskId: string): Promise<ZohoTaskComment[]> {
    return getProjectsList<ZohoTaskComment>(`tasks/${encodeURIComponent(taskId)}/comments`, 'comments')
}
