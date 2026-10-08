import {
    countTasks,
    type IndexRenderContext,
    type RenderedIndex,
    type TreeMilestone,
} from '@/zoho-projects/entities/milestone'
import { prefixNumber, taskFileBaseName } from '@/zoho-projects/entities/task'
import { cleanName, renderFrontmatter, toDisplayName, toSlug, zohoProjectsUrl } from '@/zoho-projects/md'

import type { TreeTaskList } from '../task-list.types'

export function renderTaskListIndex(
    taskList: TreeTaskList,
    milestone: TreeMilestone,
    context: IndexRenderContext
): RenderedIndex {
    const url = zohoProjectsUrl(context.projects, 'tasklist-detail', taskList.id)
    const counts = countTasks(taskList)
    const rows = taskList.statuses
        .flatMap((status) => status.tasks.map((task) => ({ status: status.name, task: task.record })))
        .sort((left, right) => prefixNumber(left.task) - prefixNumber(right.task))

    const frontmatter = {
        type: 'tasklist',
        id: taskList.id,
        name: taskList.name,
        url,
        milestone: milestone.name,
        milestone_id: milestone.id,
        tasks_rendered: counts.total,
        tasks_open: counts.open,
        rendered_at: context.renderedAt,
    }

    const lines = [
        renderFrontmatter(frontmatter),
        '',
        `# ${taskList.name}`,
        '',
        `[Open in Zoho](${url})`,
        '',
        `Milestone: [[${toDisplayName(milestone.name)}]]`,
        '',
        '| Task | Status | Priority | Created |',
        '|---|---|---|---|',
        ...rows.map(({ status, task }) => {
            const label = `${task.prefix ?? task.id} ${cleanName(task.name)}`.replace(/\|/g, '-')

            return `| [[${taskFileBaseName(task)}\\|${label}]] | ${status} | ${task.priority ?? 'none'} | ${task.created_time?.slice(0, 10) ?? ''} |`
        }),
        '',
    ]

    return {
        segments: [
            toSlug(milestone.name, milestone.id),
            toSlug(taskList.name, taskList.id),
            `${toDisplayName(taskList.name)}.md`,
        ],
        content: lines.join('\n'),
    }
}
