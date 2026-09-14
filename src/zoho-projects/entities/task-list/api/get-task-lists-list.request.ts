import { getProjectsList } from '@/shared/api/projects'

import type { ZohoTaskList } from '../task-list.types'

/** Returns every task list of the configured project. */
export function getTaskListsList(): Promise<ZohoTaskList[]> {
    return getProjectsList<ZohoTaskList>('tasklists', 'tasklists')
}
