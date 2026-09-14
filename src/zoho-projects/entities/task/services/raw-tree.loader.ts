import { readdir } from 'node:fs/promises'
import { join, sep } from 'node:path'

import {
    noMilestoneDirName,
    noTaskListDirName,
    rawDirName,
    taskListsDirName,
    tasksDirName,
    zohoProjectsDirName,
} from '@/zoho-projects/zoho-projects.config'
import { cleanName } from '@/zoho-projects/md'
import type { TreeMilestone, ZohoMilestone } from '@/zoho-projects/entities/milestone'
import type { TreeTaskList, ZohoTaskList } from '@/zoho-projects/entities/task-list'
import { resolveArtifactPath } from '@/shared/artifacts'
import { logger } from '@/shared/logger'

import type { TreeStatus, TreeTask, ZohoTask, ZohoTaskComment } from '../task.types'
import { prefixNumber } from '../task.utils'

export interface RawTree {
    milestones: TreeMilestone[]
    tasksById: Map<string, TreeTask>
    /** Every task names its project; the first one seen is as good as any. */
    projectName: string | null
    /** Files under `raw/` that were not valid JSON; the render goes on without them and ends non-zero. */
    skippedFiles: string[]
}

const commentsSuffix = '.comments.json'

/**
 * Reads `raw/` into milestones → task lists → statuses → tasks. Parents come from the fields of each
 * task, not from the folder it sits in: `raw/` accumulates, so a renamed or moved entity has two
 * folders, and the record with the later modification time is the one that counts.
 */
export async function loadRawTree(projectPath: string): Promise<RawTree> {
    const rawPath = resolveArtifactPath(projectPath, [zohoProjectsDirName, rawDirName])
    const files = await readdir(rawPath, { recursive: true, withFileTypes: true }).catch(() => [])
    const milestones = new Map<string, ZohoMilestone>()
    const taskLists = new Map<string, ZohoTaskList>()
    const tasks = new Map<string, ZohoTask>()
    const commentsByTaskId = new Map<string, ZohoTaskComment[]>()
    const skippedFiles: string[] = []

    for (const file of files) {
        if (!file.isFile() || !file.name.endsWith('.json')) {
            continue
        }

        const filePath = join(file.parentPath, file.name)
        const parsed = await Bun.file(filePath)
            .json()
            .catch(() => undefined)

        if (parsed === undefined) {
            logger.warn({ file: filePath }, 'Raw file is not valid JSON, skipped')
            skippedFiles.push(filePath)
            continue
        }

        const level = resolveLevel(filePath.slice(rawPath.length + 1))

        if (file.name.endsWith(commentsSuffix)) {
            commentsByTaskId.set(file.name.slice(0, -commentsSuffix.length), Array.isArray(parsed) ? parsed : [])
        } else if (level === 'task') {
            keepLatest(tasks, parsed as ZohoTask, 'last_modified_time')
        } else if (level === 'taskList') {
            keepLatest(taskLists, parsed as ZohoTaskList, 'last_updated_time')
        } else if (level === 'milestone') {
            keepLatest(milestones, parsed as ZohoMilestone, 'last_modified_time')
        }
    }

    return { ...buildTree(milestones, taskLists, tasks, commentsByTaskId), skippedFiles }
}

type RawLevel = 'milestone' | 'taskList' | 'task' | null

/** `<m>/<id>.json` · `<m>/task-lists/<tl>/<id>.json` · `<m>/task-lists/<tl>/tasks/<t>/<id>.json` */
function resolveLevel(relativePath: string): RawLevel {
    const segments = relativePath.split(sep)

    if (segments.length === 2) {
        return 'milestone'
    }

    if (segments.length === 4 && segments[1] === taskListsDirName) {
        return 'taskList'
    }

    if (segments.length === 6 && segments[1] === taskListsDirName && segments[3] === tasksDirName) {
        return 'task'
    }

    return null
}

function keepLatest<Record extends { id: string }>(
    records: Map<string, Record>,
    record: Record,
    timeField: keyof Record
): void {
    if (typeof record?.id !== 'string') {
        return
    }

    const known = records.get(record.id)

    if (!known || String(record[timeField] ?? '') >= String(known[timeField] ?? '')) {
        records.set(record.id, record)
    }
}

function getOrCreate<Value>(map: Map<string, Value>, key: string, create: () => Value): Value {
    let value = map.get(key)

    if (value === undefined) {
        value = create()
        map.set(key, value)
    }

    return value
}

function buildTree(
    milestones: Map<string, ZohoMilestone>,
    taskLists: Map<string, ZohoTaskList>,
    tasks: Map<string, ZohoTask>,
    commentsByTaskId: Map<string, ZohoTaskComment[]>
): Omit<RawTree, 'skippedFiles'> {
    const treeMilestones = new Map<string, TreeMilestone>()
    const treeTaskLists = new Map<string, TreeTaskList>()
    const tasksById = new Map<string, TreeTask>()

    const milestoneOf = (id: string, name: string): TreeMilestone =>
        getOrCreate(treeMilestones, id, () => {
            const record = milestones.get(id) ?? null

            return { id, name: cleanName(record?.name ?? name), record, taskLists: [] }
        })

    const taskListOf = (id: string, name: string, milestone: TreeMilestone): TreeTaskList =>
        getOrCreate(treeTaskLists, id, () => {
            const record = taskLists.get(id) ?? null
            const taskList = {
                id,
                name: cleanName(record?.name ?? name),
                milestoneId: milestone.id,
                record,
                statuses: [],
            }

            milestone.taskLists.push(taskList)

            return taskList
        })

    const statusOf = (taskList: TreeTaskList, task: ZohoTask): TreeStatus => {
        const name = task.status?.name ?? 'Unknown'

        return (
            taskList.statuses.find((status) => status.name === name) ??
            taskList.statuses[
                taskList.statuses.push({ name, isClosed: task.status?.is_closed_type === true, tasks: [] }) - 1
            ]!
        )
    }

    for (const task of tasks.values()) {
        const milestone = task.milestone?.id
            ? milestoneOf(task.milestone.id, task.milestone.name)
            : milestoneOf(noMilestoneDirName, noMilestoneDirName)
        const taskList = task.tasklist?.id
            ? taskListOf(task.tasklist.id, task.tasklist.name, milestone)
            : taskListOf(`${milestone.id}/${noTaskListDirName}`, noTaskListDirName, milestone)
        const treeTask = { record: task, comments: commentsByTaskId.get(task.id) ?? [] }

        statusOf(taskList, task).tasks.push(treeTask)
        tasksById.set(task.id, treeTask)
    }

    for (const milestone of milestones.values()) {
        milestoneOf(milestone.id, milestone.name)
    }

    for (const taskList of taskLists.values()) {
        const milestone = taskList.milestone?.id
            ? milestoneOf(taskList.milestone.id, taskList.milestone.name)
            : milestoneOf(noMilestoneDirName, noMilestoneDirName)

        taskListOf(taskList.id, taskList.name, milestone)
    }

    const projectName = [...tasks.values()].find((task) => task.project?.name)?.project?.name ?? null

    return { milestones: sortTree([...treeMilestones.values()]), tasksById, projectName }
}

/** Folder listing order is not stable, so the tree is sorted: names, open statuses first, tasks by prefix number. */
function sortTree(milestones: TreeMilestone[]): TreeMilestone[] {
    for (const milestone of milestones) {
        milestone.taskLists.sort(byName)

        for (const taskList of milestone.taskLists) {
            taskList.statuses.sort(
                (left, right) => Number(left.isClosed) - Number(right.isClosed) || byName(left, right)
            )

            for (const status of taskList.statuses) {
                status.tasks.sort(
                    (left, right) =>
                        prefixNumber(left.record) - prefixNumber(right.record) || byName(left.record, right.record)
                )
            }
        }
    }

    return milestones.sort(byName)
}

/** The fixed `_no-*` folders sort after every Zoho name. */
function byName(left: { name: string }, right: { name: string }): number {
    return Number(left.name.startsWith('_')) - Number(right.name.startsWith('_')) || left.name.localeCompare(right.name)
}
