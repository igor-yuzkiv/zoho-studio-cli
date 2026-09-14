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
import type { TreeMilestone, ZohoMilestone } from '@/zoho-projects/entities/milestone'
import type { TreeTaskList, ZohoTaskList } from '@/zoho-projects/entities/task-list'
import { resolveArtifactPath } from '@/shared/artifacts'
import { logger } from '@/shared/logger'

import type { TreeStatus, TreeTask, ZohoTask, ZohoTaskComment } from '../task.types'

export interface RawTree {
    milestones: TreeMilestone[]
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

    return { milestones: buildTree(milestones, taskLists, tasks, commentsByTaskId), skippedFiles }
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

function buildTree(
    milestones: Map<string, ZohoMilestone>,
    taskLists: Map<string, ZohoTaskList>,
    tasks: Map<string, ZohoTask>,
    commentsByTaskId: Map<string, ZohoTaskComment[]>
): TreeMilestone[] {
    const treeMilestones = new Map<string, TreeMilestone>()
    const treeTaskLists = new Map<string, TreeTaskList>()

    const milestoneOf = (id: string, name: string): TreeMilestone => {
        let milestone = treeMilestones.get(id)

        if (!milestone) {
            const record = milestones.get(id) ?? null

            milestone = { id, name: record?.name ?? name, record, taskLists: [] }
            treeMilestones.set(id, milestone)
        }

        return milestone
    }

    const taskListOf = (id: string, name: string, milestone: TreeMilestone): TreeTaskList => {
        let taskList = treeTaskLists.get(id)

        if (!taskList) {
            const record = taskLists.get(id) ?? null

            taskList = { id, name: record?.name ?? name, milestoneId: milestone.id, record, statuses: [] }
            treeTaskLists.set(id, taskList)
            milestone.taskLists.push(taskList)
        }

        return taskList
    }

    for (const task of tasks.values()) {
        const milestone = task.milestone?.id
            ? milestoneOf(task.milestone.id, task.milestone.name)
            : milestoneOf(noMilestoneDirName, noMilestoneDirName)
        const taskList = task.tasklist?.id
            ? taskListOf(task.tasklist.id, task.tasklist.name, milestone)
            : taskListOf(`${milestone.id}/${noTaskListDirName}`, noTaskListDirName, milestone)

        statusOf(taskList, task).tasks.push({ record: task, comments: commentsByTaskId.get(task.id) ?? [] })
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

    return sortTree([...treeMilestones.values()])
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

function prefixNumber(task: ZohoTask): number {
    return Number(task.prefix?.match(/(\d+)$/)?.[1] ?? 0)
}

function statusOf(taskList: TreeTaskList, task: ZohoTask): TreeStatus {
    const name = task.status?.name ?? 'Unknown'
    let status = taskList.statuses.find((candidate) => candidate.name === name)

    if (!status) {
        status = { name, isClosed: task.status?.is_closed_type === true, tasks: [] }
        taskList.statuses.push(status)
    }

    return status
}

export type { TreeTask }
