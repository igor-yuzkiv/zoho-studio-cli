import type { JsonBundle } from '@cli/commands/browser/browser.types'

export type Person = { name?: string; full_name?: string }

export type ProjectsRecord = {
    id: string
    name: string
    prefix?: string
    description?: string
    status?: { name?: string; is_closed_type?: boolean; color_code?: string }
    priority?: string
    owners_and_work?: { owners?: Person[] }
    assignee?: Person
    created_by?: Person
    created_time?: string
    last_modified_time?: string
    last_updated_time?: string
    start_date?: string
    end_date?: string
    due_date?: string
    completion_percentage?: number
    severity?: { value?: string }
    classification?: { value?: string }
    tags?: { name: string }[]
    log_hours?: { total_hours?: string }
    [field: string]: unknown
}

export type ProjectsComment = {
    id: string
    comment?: string
    created_time?: string
    created_by?: Person
    added_by?: Person
}

export type LoadedRecord = {
    path: string
    directory: string
    record: ProjectsRecord
    comments: ProjectsComment[]
}

export type TaskListNode = { name: string; record: LoadedRecord | null; tasks: LoadedRecord[] }
export type MilestoneNode = { name: string; record: LoadedRecord | null; taskLists: TaskListNode[] }

const commentsSuffix = '.comments.json'

/** Reads `<folder>/<id>.json` records with the `<id>.comments.json` next to each. */
export function loadRecords(bundle: JsonBundle | null): LoadedRecord[] {
    const entries = Object.entries(bundle ?? {})

    return entries
        .filter(
            ([path, value]) => !path.endsWith(commentsSuffix) && value && typeof value === 'object' && 'id' in value
        )
        .map(([path, value]) => {
            const comments = bundle?.[path.replace(/\.json$/, commentsSuffix)]

            return {
                path,
                directory: path.slice(0, path.lastIndexOf('/')),
                record: value as ProjectsRecord,
                comments: Array.isArray(comments) ? (comments as ProjectsComment[]) : [],
            }
        })
}

/**
 * Rebuilds the milestone → task list → task tree from where the pulls put each file:
 * `raw/<milestone>/`, `…/task-lists/<task list>/` and `…/tasks/<task>/`.
 */
export function buildTaskTree(records: LoadedRecord[]): MilestoneNode[] {
    const milestones = new Map<string, MilestoneNode>()

    const milestoneOf = (name: string) => {
        if (!milestones.has(name)) {
            milestones.set(name, { name, record: null, taskLists: [] })
        }

        return milestones.get(name)!
    }

    const taskListOf = (milestone: MilestoneNode, name: string) => {
        let taskList = milestone.taskLists.find((candidate) => candidate.name === name)

        if (!taskList) {
            taskList = { name, record: null, tasks: [] }
            milestone.taskLists.push(taskList)
        }

        return taskList
    }

    for (const loaded of records) {
        const segments = loaded.path.split('/').slice(2, -1)
        const [milestoneName, taskListsDir, taskListName, tasksDir] = segments

        if (!milestoneName || milestoneName === 'issues') {
            continue
        }

        const milestone = milestoneOf(milestoneName)

        if (segments.length === 1) {
            milestone.record = loaded
        } else if (taskListsDir === 'task-lists' && taskListName && segments.length === 3) {
            taskListOf(milestone, taskListName).record = loaded
        } else if (taskListName && tasksDir === 'tasks' && segments.length === 5) {
            taskListOf(milestone, taskListName).tasks.push(loaded)
        }
    }

    const byName = <TNode extends { name: string }>(left: TNode, right: TNode) =>
        // Folders without a parent start with "_" and go last.
        Number(left.name.startsWith('_')) - Number(right.name.startsWith('_')) || left.name.localeCompare(right.name)

    return [...milestones.values()].sort(byName).map((milestone) => ({
        ...milestone,
        taskLists: milestone.taskLists.sort(byName).map((taskList) => ({
            ...taskList,
            tasks: taskList.tasks.sort((left, right) => left.record.name.localeCompare(right.record.name)),
        })),
    }))
}

export function personName(person: Person | undefined): string {
    return person?.full_name ?? person?.name ?? '—'
}

export function isClosed(record: ProjectsRecord): boolean {
    return record.status?.is_closed_type === true
}
