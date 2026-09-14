import { stringify } from 'yaml'

import {
    countTasks,
    type IndexRenderContext,
    type RenderedIndex,
    type TreeMilestone,
} from '@/zoho-projects/entities/milestone'
import {
    decodeHtmlEntities,
    prefixNumber,
    taskFileBaseName,
    toDisplayName,
    toSlug,
} from '@/zoho-projects/entities/task'

import type { TreeTaskList } from '../task-list.types'

export function taskListUrl(projects: IndexRenderContext['projects'], taskListId: string): string {
    return `https://projects.zoho.com/portal/${projects.portalId}#zp/projects/${projects.projectId}/tasklist-detail/${taskListId}`
}

export function renderTaskListIndex(
    taskList: TreeTaskList,
    milestone: TreeMilestone,
    context: IndexRenderContext
): RenderedIndex {
    const name = decodeHtmlEntities(taskList.name).trim()
    const milestoneName = decodeHtmlEntities(milestone.name).trim()
    const url = taskListUrl(context.projects, taskList.id)
    const counts = countTasks([taskList])
    const rows = taskList.statuses
        .flatMap((status) => status.tasks.map((task) => ({ status: status.name, task: task.record })))
        .sort((left, right) => Number(prefixNumber(left.task)) - Number(prefixNumber(right.task)))

    const frontmatter = {
        type: 'tasklist',
        id: taskList.id,
        name,
        url,
        milestone: milestoneName,
        milestone_id: milestone.id,
        tasks_rendered: counts.total,
        tasks_open: counts.open,
        rendered_at: context.renderedAt,
    }

    const lines = [
        '---',
        stringify(frontmatter, { indentSeq: false, lineWidth: 0, singleQuote: true }).trimEnd(),
        '---',
        '',
        `# ${name}`,
        '',
        `[Open in Zoho](${url})`,
        '',
        `Milestone: [[${toDisplayName(milestoneName)}]]`,
        '',
        '| Task | Status | Priority | Created |',
        '|---|---|---|---|',
        ...rows.map(({ status, task }) => {
            const label = `${task.prefix ?? task.id} ${decodeHtmlEntities(task.name).trim()}`.replace(/\|/g, '-')

            return `| [[${taskFileBaseName(task)}\\|${label}]] | ${status} | ${task.priority ?? 'none'} | ${task.created_time?.slice(0, 10) ?? ''} |`
        }),
        '',
    ]

    return { segments: [toSlug(milestoneName), toSlug(name), `${toDisplayName(name)}.md`], content: lines.join('\n') }
}
