import { taskListsDirName } from '@/zoho-projects/zoho-projects.config'
import { findRawEntityDir, writeRawEntity } from '@/zoho-projects/raw'
import { MilestoneResolver, noMilestoneSegments } from '@/zoho-projects/entities/milestone'

import type { ZohoTaskList } from './task-list.types'

/** A task list flagged as outside any milestone points at Zoho's "None" pseudo-milestone, which cannot be fetched. */
export function isOutsideMilestone(taskList: ZohoTaskList): boolean {
    return taskList.meta_info?.is_none_milestone_tasklist === true || !taskList.milestone?.id
}

/** Returns the `task-lists/` segments the task list belongs in, fetching its milestone when it is not local yet. */
export async function resolveTaskListParentSegments(
    taskList: ZohoTaskList,
    milestones: MilestoneResolver
): Promise<string[]> {
    const milestoneSegments = isOutsideMilestone(taskList)
        ? noMilestoneSegments
        : await milestones.resolveSegments(taskList.milestone!.id)

    return [...milestoneSegments, taskListsDirName]
}

/** Returns the segments of the task list's folder, written or updated in place under its parent. */
export function writeTaskList(
    projectPath: string,
    parentSegments: string[],
    taskList: ZohoTaskList
): Promise<string[]> {
    return writeRawEntity(projectPath, parentSegments, taskList)
}

/** Returns the segments of the task list's folder when a previous pull already wrote it under this parent. */
export async function findTaskListSegments(
    projectPath: string,
    parentSegments: string[],
    taskListId: string
): Promise<string[] | null> {
    const dirName = await findRawEntityDir(projectPath, parentSegments, taskListId)

    return dirName ? [...parentSegments, dirName] : null
}
