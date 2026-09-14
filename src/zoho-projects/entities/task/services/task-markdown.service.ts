import { stringify } from 'yaml'

import type { ProjectSettings } from '@/settings'
import type { TreeMilestone } from '@/zoho-projects/entities/milestone'
import type { TreeTaskList } from '@/zoho-projects/entities/task-list'

import type { TreeStatus, TreeTask, ZohoPerson, ZohoTask } from '../task.types'
import { taskFileBaseName, toSlug } from '../task.utils'
import { decodeHtmlEntities, htmlToMarkdown } from './html-to-markdown.service'

export interface RenderedTask {
    /** Path segments below `md/`: milestone slug, task list slug, status slug, `<n>-<slug>.md`. */
    segments: string[]
    content: string
}

/** Where a task sits in the tree, plus the lookup of every task the cross-links may point at. */
export interface TaskRenderContext {
    projects: Pick<ProjectSettings['projects'], 'portalId' | 'projectId'>
    milestone: TreeMilestone
    taskList: TreeTaskList
    status: TreeStatus
    tasksById: Map<string, TreeTask>
}

export function taskUrl(projects: TaskRenderContext['projects'], taskId: string): string {
    return `https://projects.zoho.com/portal/${projects.portalId}#zp/projects/${projects.projectId}/task-detail/${taskId}`
}

/** `:`, `|`, `/`, `[`, `]` become ` -`; wikilinks point at this name, so it is never cut. */
export function toDisplayName(name: string): string {
    return decodeHtmlEntities(name)
        .replace(/[:|/[\]]/g, ' -')
        .replace(/\s+/g, ' ')
        .trim()
}

export function renderTask(treeTask: TreeTask, context: TaskRenderContext): RenderedTask {
    const task = treeTask.record
    const name = decodeHtmlEntities(task.name).trim()
    const milestoneName = decodeHtmlEntities(context.milestone.name).trim()
    const taskListName = decodeHtmlEntities(context.taskList.name).trim()
    const url = taskUrl(context.projects, task.id)
    const description = htmlToMarkdown(task.description ?? '')
    const comments = [...treeTask.comments].sort((left, right) =>
        String(right.created_time ?? '').localeCompare(String(left.created_time ?? ''))
    )
    const commentBodies = comments.map((comment) => htmlToMarkdown(comment.comment ?? ''))
    const crossLinks = resolveCrossLinks(task, [description, ...commentBodies], context.tasksById)

    const frontmatter = {
        type: 'task',
        id: task.id,
        prefix: task.prefix ?? null,
        name,
        url,
        status: context.status.name,
        is_closed: context.status.isClosed,
        priority: task.priority ?? null,
        task_type: task.task_type ?? null,
        milestone: milestoneName,
        milestone_id: context.milestone.id,
        tasklist: taskListName,
        tasklist_id: context.taskList.id,
        owners: (task.owners_and_work?.owners ?? []).map(toPersonEntry),
        created_by: task.created_by ? toPersonEntry(task.created_by) : null,
        created_time: task.created_time ?? null,
        last_modified_time: task.last_modified_time ?? null,
        start_date: task.start_date ?? null,
        end_date: task.end_date ?? null,
        completed_on: task.completed_on ?? null,
        completion_percentage: task.completion_percentage ?? null,
        tags: (task.tags ?? []).map((tag) => tag.name),
        logged_hours: task.log_hours?.total_hours ?? null,
        has_comments: task.association_info?.has_comments ?? treeTask.comments.length > 0,
        has_subtasks: task.association_info?.has_subtasks ?? false,
        comments_count: treeTask.comments.length,
        related_tasks: crossLinks.filter((link) => link.fileBaseName).map((link) => link.fileBaseName),
    }

    const lines = [
        '---',
        stringify(frontmatter, { indentSeq: false, lineWidth: 0, singleQuote: true }).trimEnd(),
        '---',
        '',
        `# ${task.prefix ? `${task.prefix}: ` : ''}${name}`,
        '',
        `[Open in Zoho](${url})`,
        '',
        `Tasklist: [[${toDisplayName(taskListName)}]] · Milestone: [[${toDisplayName(milestoneName)}]]`,
        '',
        '## Description',
        '',
        description || '_(empty)_',
        '',
        '## Cross task links',
        '',
        crossLinks.length > 0 ? crossLinks.map((link) => `- ${link.line}`).join('\n') : '_(none)_',
        '',
        '## Comments',
        '',
        comments.length > 0
            ? comments
                  .map((comment, index) => {
                      const author = comment.created_by
                      const heading = `### ${formatCommentTime(comment.created_time)} — ${author?.full_name ?? author?.name ?? 'Unknown'}${author?.is_client_user ? ' (client)' : ''}`

                      return `${heading}\n\n\`\`\`markdown\n${commentBodies[index]}\n\`\`\``
                  })
                  .join('\n\n')
            : '_(no comments)_',
        '',
    ]

    return {
        segments: [
            toSlug(milestoneName),
            toSlug(taskListName),
            toSlug(context.status.name),
            `${taskFileBaseName(task)}.md`,
        ],
        content: lines.join('\n'),
    }
}

interface CrossLink {
    line: string
    fileBaseName: string | null
}

/** Dependencies first, then every task mentioned by id or prefix in the description and comments, each once. */
function resolveCrossLinks(task: ZohoTask, texts: string[], tasksById: Map<string, TreeTask>): CrossLink[] {
    const links = new Map<string, CrossLink>()
    const prefixLetters = task.prefix?.match(/^(.*?)(\d+)$/)?.[1]
    const tasksByPrefix = new Map<string, TreeTask>()

    for (const candidate of tasksById.values()) {
        if (candidate.record.prefix) {
            tasksByPrefix.set(candidate.record.prefix, candidate)
        }
    }

    const add = (key: string, found: TreeTask | undefined, fallbackLabel: string, relation?: string): void => {
        if (key === task.id || key === task.prefix || links.has(key)) {
            return
        }

        if (!found) {
            links.set(key, { line: `${fallbackLabel} — not pulled`, fileBaseName: null })
            return
        }

        const label = found.record.prefix ?? found.record.id
        const detail = relation
            ? `(${relation})`
            : `${decodeHtmlEntities(found.record.name)} (${found.record.status?.name ?? 'Unknown'})`

        links.set(key, {
            line: `[[${taskFileBaseName(found.record)}]] — ${label} ${detail}`,
            fileBaseName: taskFileBaseName(found.record),
        })
    }

    for (const [relation, related] of [
        ['predecessor', task.dependency_info?.predecessor ?? []],
        ['successor', task.dependency_info?.successor ?? []],
    ] as const) {
        for (const { id } of related) {
            add(id, tasksById.get(id), `task ${id}`, relation)
        }
    }

    const text = texts.join('\n')

    // An id-only mention has no readable label, so it is listed only when the task is in the tree.
    for (const [, id] of text.matchAll(/task-detail\/(\d+)/g)) {
        const found = tasksById.get(id!)

        if (found) {
            add(id!, found, `task ${id}`)
        }
    }

    if (prefixLetters) {
        const prefixPattern = new RegExp(`\\b(${prefixLetters.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\d+)\\b`, 'g')

        for (const [, prefix] of text.matchAll(prefixPattern)) {
            const found = tasksByPrefix.get(prefix!)

            add(found?.record.id ?? prefix!, found, prefix!)
        }
    }
    return [...links.values()]
        .filter((link, index, all) => all.findIndex((other) => other.line === link.line) === index)
        .filter((link, index, all) => all.findIndex((other) => other.line === link.line) === index)
}

function toPersonEntry(person: ZohoPerson): { name: string | null; email: string | null } {
    return { name: person.name ?? person.full_name ?? null, email: person.email ?? null }
}

function formatCommentTime(time: string | undefined): string {
    const date = time ? new Date(time) : null

    if (!date || Number.isNaN(date.getTime())) {
        return 'unknown time'
    }

    return `${date.toISOString().slice(0, 10)} ${date.toISOString().slice(11, 16)} UTC`
}
