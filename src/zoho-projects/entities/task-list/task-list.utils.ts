import { readdir } from 'node:fs/promises'

import { taskListsDirName } from '@/zoho-projects/zoho-projects.config'
import { findRawEntityDir, writeRawEntity } from '@/zoho-projects/raw'
import { MilestoneResolver, milestonesParentSegments, noMilestoneSegments } from '@/zoho-projects/entities/milestone'
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

/**
 * Returns the task list's folder, fetching and writing the task list (and its milestone) when no
 * earlier pull has it. Local lookup scans every milestone folder, because a task alone does not
 * say whether its milestone is a real one or Zoho's "None".
 */
export class TaskListResolver {
    private remoteTaskLists: Promise<Map<string, ZohoTaskList>> | null = null

    constructor(
        private readonly projectPath: string,
        private readonly milestones: MilestoneResolver
    ) {}

    async resolveSegments(taskListId: string): Promise<string[]> {
        const local = await this.findLocalSegments(taskListId)

        if (local) {
            return local
        }

        const taskList = (await this.fetchRemoteTaskLists()).get(taskListId)

        if (!taskList) {
            throw new Error(`Task list "${taskListId}" is not in the project.`)
        }

        const parentSegments = await resolveTaskListParentSegments(taskList, this.milestones)

        return writeTaskList(this.projectPath, parentSegments, taskList)
    }

    private async findLocalSegments(taskListId: string): Promise<string[] | null> {
        const milestonesPath = resolveArtifactPath(this.projectPath, milestonesParentSegments)
        const entries = await readdir(milestonesPath, { withFileTypes: true }).catch(() => [])

        for (const entry of entries) {
            if (!entry.isDirectory()) {
                continue
            }

            const found = await findTaskListSegments(
                this.projectPath,
                [...milestonesParentSegments, entry.name, taskListsDirName],
                taskListId
            )

            if (found) {
                return found
            }
        }

        return null
    }

    private fetchRemoteTaskLists(): Promise<Map<string, ZohoTaskList>> {
        this.remoteTaskLists ??= getTaskListsList().then(
            (taskLists) => new Map(taskLists.map((taskList) => [taskList.id, taskList]))
        )

        return this.remoteTaskLists
    }
}
