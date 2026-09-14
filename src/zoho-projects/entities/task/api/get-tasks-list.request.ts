import { getProjectsList } from '@/shared/api/projects'

import type { ZohoTask } from '../task.types'

/** Returns every task of the configured project; subtasks arrive in the same list. */
export function getTasksList(): Promise<ZohoTask[]> {
    return getProjectsList<ZohoTask>('tasks', 'tasks')
}
