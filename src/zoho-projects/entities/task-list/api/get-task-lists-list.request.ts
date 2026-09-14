import { getProjectsList } from '@/shared/api/projects'

import type { ZohoTaskList } from '../task-list.types'

export function getTaskListsList(): Promise<ZohoTaskList[]> {
    return getProjectsList<ZohoTaskList>('tasklists', 'tasklists')
}
