import { getProjectsList } from '../../../api'

import type { ZohoTask } from '../task.types'

/** Returns every task of the configured project; subtasks arrive in the same list. */
export function getTasksList(): Promise<ZohoTask[]> {
    return getProjectsList<ZohoTask>('tasks', 'tasks')
}
