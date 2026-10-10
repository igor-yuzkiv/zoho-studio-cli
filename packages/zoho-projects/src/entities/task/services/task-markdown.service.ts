import type { TreeMilestone } from '../../milestone'
import type { TreeTaskList } from '../../task-list'
import {
    cleanName,
    type CrossLinkSource,
    type ProjectRef,
    renderCommentBlock,
    renderFrontmatter,
    resolveCrossLinks,
    sortCommentsNewestFirst,
    toDisplayName,
    toPersonEntry,
    toSlug,
    zohoProjectsUrl,
} from '../../../md'

import type { TreeStatus, TreeTask, ZohoTask } from '../task.types'
import { taskFileBaseName } from '../task.utils'
import { htmlToMarkdown } from './html-to-markdown.service'

export interface RenderedTask {
    /** Path segments below `md/`: milestone slug, task list slug, status slug, `<n>-<slug>.md`. */
    segments: string[]
    content: string
}

/** Where a task sits in the tree, plus the lookup of every task the cross-links may point at. */
export interface TaskRenderContext {
    projects: ProjectRef
    milestone: TreeMilestone
    taskList: TreeTaskList
    status: TreeStatus
    tasksById: Map<string, TreeTask>
}

export function renderTask(treeTask: TreeTask, context: TaskRenderContext): RenderedTask {
    const task = treeTask.record
    const name = cleanName(task.name)
    const url = zohoProjectsUrl(context.projects, 'task-detail', task.id)
    const description = htmlToMarkdown(task.description ?? '')
    const comments = sortCommentsNewestFirst(treeTask.comments)
    const commentBodies = comments.map((comment) => htmlToMarkdown(comment.comment ?? ''))
    const crossLinks = resolveCrossLinks(task, [description, ...commentBodies], taskDependencies(task), [
        tasksCrossLinkSource(context.tasksById),
    ])

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
        milestone: context.milestone.name,
        milestone_id: context.milestone.id,
        tasklist: context.taskList.name,
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
        related_tasks: crossLinks.flatMap((link) => (link.target ? [link.target.fileBaseName] : [])),
    }

    const lines = [
        renderFrontmatter(frontmatter),
        '',
        `# ${task.prefix ? `${task.prefix}: ` : ''}${name}`,
        '',
        `[Open in Zoho](${url})`,
        '',
        `Tasklist: [[${toDisplayName(context.taskList.name)}]] · Milestone: [[${toDisplayName(context.milestone.name)}]]`,
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
                  .map((comment, index) => renderCommentBlock(comment.created_time, comment.created_by, commentBodies[index]!))
                  .join('\n\n')
            : '_(no comments)_',
        '',
    ]

    return {
        segments: [
            toSlug(context.milestone.name, context.milestone.id),
            toSlug(context.taskList.name, context.taskList.id),
            toSlug(context.status.name, 'unknown'),
            `${taskFileBaseName(task)}.md`,
        ],
        content: lines.join('\n'),
    }
}

/** Every pulled task as a cross-link target; the task file of an issue points at these too. */
export function tasksCrossLinkSource(tasksById: Map<string, TreeTask>): CrossLinkSource {
    return {
        label: 'task',
        prefixLetter: 'T',
        urlKind: 'task-detail',
        targets: [...tasksById.values()].map(({ record }) => ({
            id: record.id,
            prefix: record.prefix ?? null,
            name: record.name,
            status: record.status?.name ?? null,
            fileBaseName: taskFileBaseName(record),
        })),
    }
}

function taskDependencies(task: ZohoTask): { relation: string; id: string }[] {
    return [
        ...(task.dependency_info?.predecessor ?? []).map(({ id }) => ({ relation: 'predecessor', id })),
        ...(task.dependency_info?.successor ?? []).map(({ id }) => ({ relation: 'successor', id })),
    ]
}
