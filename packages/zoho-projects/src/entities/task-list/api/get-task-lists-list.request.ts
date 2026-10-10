import { getProjectsList } from '../../../api'

import type { ZohoTaskList } from '../task-list.types'

export function getTaskListsList(): Promise<ZohoTaskList[]> {
    return getProjectsList<ZohoTaskList>('tasklists', 'tasklists')
}
