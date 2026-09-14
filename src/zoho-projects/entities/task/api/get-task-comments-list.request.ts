import { getProjectsList } from '@/shared/api/projects'

import type { ZohoTaskComment } from '../task.types'

/** Returns every comment of one task. */
export function getTaskCommentsList(taskId: string): Promise<ZohoTaskComment[]> {
    return getProjectsList<ZohoTaskComment>(`tasks/${encodeURIComponent(taskId)}/comments`, 'comments')
}
