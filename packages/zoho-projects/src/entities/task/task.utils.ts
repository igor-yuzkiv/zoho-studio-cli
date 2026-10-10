import { noTaskListDirName, taskListsDirName, tasksDirName } from '../../zoho-projects.config'
import { writeRawEntity } from '../../raw'
import type { MilestoneResolver } from '../milestone'
import type { TaskListResolver } from '../task-list'
import { writeArtifactJson } from '@zoho-studio/core'
import { isInPeriod, type Period } from '../../period.utils'

import { toSlug } from '../../md'
import type { ZohoTask, ZohoTaskComment } from './task.types'

/** A task is in the period by its last modification. */
export function isTaskInPeriod(task: ZohoTask, period: Period): boolean {
    return isInPeriod(task.last_modified_time, period)
}

/** Returns the `tasks/` segments the task belongs in, fetching its task list and milestone when they are not local yet. */
export async function resolveTaskParentSegments(
    task: ZohoTask,
    taskLists: TaskListResolver,
    milestones: MilestoneResolver
): Promise<string[]> {
    if (task.tasklist?.id) {
        return [...(await taskLists.resolveSegments(task.tasklist.id)), tasksDirName]
    }

    if (!task.milestone?.id) {
        throw new Error(`Task "${task.id}" has neither a task list nor a milestone.`)
    }

    return [...(await milestones.resolveSegments(task.milestone.id)), taskListsDirName, noTaskListDirName, tasksDirName]
}

/** Writes `<task>/<id>.json` and `<task>/<id>.comments.json` — the comments file always, so every task folder looks alike. */
export async function writeTask(
    projectPath: string,
    parentSegments: string[],
    task: ZohoTask,
    comments: ZohoTaskComment[]
): Promise<string[]> {
    const segments = await writeRawEntity(projectPath, parentSegments, task)

    await writeArtifactJson(projectPath, [...segments, `${task.id}.comments.json`], comments)

    return segments
}

/** `SS5-T580` → 580; a task without a prefix sorts first and names its file after its id. */
export function prefixNumber(task: Pick<ZohoTask, 'prefix'>): number {
    return Number(task.prefix?.match(/(\d+)$/)?.[1] ?? 0)
}

export function taskFileBaseName(task: Pick<ZohoTask, 'id' | 'prefix' | 'name'>): string {
    return `${task.prefix?.match(/(\d+)$/)?.[1] ?? task.id}-${toSlug(task.name, task.id)}`
}
