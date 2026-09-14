import { noTaskListDirName, taskListsDirName, tasksDirName } from '@/zoho-projects/zoho-projects.config'
import { writeRawEntity } from '@/zoho-projects/raw'
import { MilestoneResolver } from '@/zoho-projects/entities/milestone'
import { TaskListResolver } from '@/zoho-projects/entities/task-list'
import { writeArtifactJson } from '@/shared/artifacts'

import type { ZohoTask, ZohoTaskComment } from './task.types'

export interface TaskPeriod {
    from?: Date
    to?: Date
}

const dateOptionPattern = /^\d{4}-\d{2}-\d{2}$/

/** Turns the `--from`/`--to` options into an inclusive UTC period: the start of `from` to the end of `to`. */
export function parseTaskPeriod(options: { from?: string; to?: string }): TaskPeriod {
    const from = options.from === undefined ? undefined : parseDateOption('--from', options.from)
    const to = options.to === undefined ? undefined : parseDateOption('--to', options.to)

    if (to) {
        to.setUTCHours(23, 59, 59, 999)
    }

    if (from && to && from > to) {
        throw new Error(`--from (${options.from}) is later than --to (${options.to}).`)
    }

    return { from, to }
}

function parseDateOption(option: string, value: string): Date {
    const date = new Date(`${value}T00:00:00.000Z`)

    if (!dateOptionPattern.test(value) || Number.isNaN(date.getTime())) {
        throw new Error(`${option} must be a date as YYYY-MM-DD, got "${value}".`)
    }

    return date
}

/** A task is in the period by its last modification; a task without one only passes an open period. */
export function isTaskInPeriod(task: ZohoTask, period: TaskPeriod): boolean {
    if (!period.from && !period.to) {
        return true
    }

    const modifiedAt = task.last_modified_time ? new Date(task.last_modified_time) : null

    if (!modifiedAt || Number.isNaN(modifiedAt.getTime())) {
        return false
    }

    return (!period.from || modifiedAt >= period.from) && (!period.to || modifiedAt <= period.to)
}

/** Returns the `tasks/` segments the task belongs in, fetching its task list and milestone when they are not local yet. */
export async function resolveTaskParentSegments(
    task: ZohoTask,
    taskLists: TaskListResolver,
    milestones: MilestoneResolver
): Promise<string[]> {
    const taskListSegments = task.tasklist?.id
        ? await taskLists.resolveSegments(task.tasklist.id)
        : [...(await milestones.resolveSegments(requireMilestoneId(task))), taskListsDirName, noTaskListDirName]

    return [...taskListSegments, tasksDirName]
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

function requireMilestoneId(task: ZohoTask): string {
    if (!task.milestone?.id) {
        throw new Error(`Task "${task.id}" has neither a task list nor a milestone.`)
    }

    return task.milestone.id
}
