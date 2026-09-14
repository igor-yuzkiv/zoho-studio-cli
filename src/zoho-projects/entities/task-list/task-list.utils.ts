import { readdir } from 'node:fs/promises'

import { taskListsDirName } from '@/zoho-projects/zoho-projects.config'
import { findRawEntitySegments, RawEntityResolver, writeRawEntity } from '@/zoho-projects/raw'
import {
    type MilestoneResolver,
    milestonesParentSegments,
    noMilestoneSegments,
} from '@/zoho-projects/entities/milestone'
import { resolveArtifactPath } from '@/shared/artifacts'

import { getTaskListsList } from './api'
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

export type TaskListResolver = RawEntityResolver<ZohoTaskList>

/**
 * Returns task list folders by id, fetching and writing a task list (and its milestone) no earlier
 * pull has. A task alone does not say whether its milestone is real or Zoho's "None", so the local
 * lookup scans every milestone folder. A task list moved between milestones leaves its old folder
 * behind; two local hits are therefore ambiguous, and Zoho's current parent decides.
 */
export function createTaskListResolver(projectPath: string, milestones: MilestoneResolver): TaskListResolver {
    return new RawEntityResolver<ZohoTaskList>({
        entityName: 'Task list',
        fetchList: getTaskListsList,
        findLocal: (id) => findLocalTaskListSegments(projectPath, id),
        write: async (taskList) =>
            writeRawEntity(projectPath, await resolveTaskListParentSegments(taskList, milestones), taskList),
    })
}

async function findLocalTaskListSegments(projectPath: string, taskListId: string): Promise<string[] | null> {
    const milestonesPath = resolveArtifactPath(projectPath, milestonesParentSegments)
    const entries = await readdir(milestonesPath, { withFileTypes: true }).catch(() => [])
    const hits: string[][] = []

    for (const entry of entries) {
        const found = entry.isDirectory()
            ? await findRawEntitySegments(
                  projectPath,
                  [...milestonesParentSegments, entry.name, taskListsDirName],
                  taskListId
              )
            : null

        if (found) {
            hits.push(found)
        }
    }

    return hits.length === 1 ? hits[0]! : null
}
