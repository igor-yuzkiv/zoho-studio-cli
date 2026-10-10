import { type ProjectRef, renderFrontmatter, toDisplayName, toSlug, zohoProjectsUrl } from '../../../md'

import type { TreeMilestone } from '../milestone.types'

export interface RenderedIndex {
    /** Path segments below `md/`; the last one is the display name with `.md`. */
    segments: string[]
    content: string
}

export interface IndexRenderContext {
    projects: ProjectRef
    projectName: string | null
    /** The date of the run, `YYYY-MM-DD`. */
    renderedAt: string
}

export function countTasks(taskList: Pick<TreeMilestone['taskLists'][number], 'statuses'>): {
    total: number
    open: number
    closed: number
} {
    let open = 0
    let closed = 0

    for (const status of taskList.statuses) {
        if (status.isClosed) {
            closed += status.tasks.length
        } else {
            open += status.tasks.length
        }
    }

    return { total: open + closed, open, closed }
}

export function renderMilestoneIndex(milestone: TreeMilestone, context: IndexRenderContext): RenderedIndex {
    const url = zohoProjectsUrl(context.projects, 'milestone-detail', milestone.id)
    const rows = milestone.taskLists.map((taskList) => ({ name: taskList.name, counts: countTasks(taskList) }))
    const total = rows.reduce((sum, row) => sum + row.counts.total, 0)
    const open = rows.reduce((sum, row) => sum + row.counts.open, 0)

    const frontmatter = {
        type: 'milestone',
        id: milestone.id,
        name: milestone.name,
        url,
        project_id: context.projects.projectId,
        project: context.projectName,
        tasks_rendered: total,
        tasks_open: open,
        tasks_closed: total - open,
        rendered_at: context.renderedAt,
    }

    const lines = [
        renderFrontmatter(frontmatter),
        '',
        `# ${milestone.name}`,
        '',
        `[Open in Zoho](${url})`,
        '',
        '| Tasklist | Tasks | Open |',
        '|---|---|---|',
        ...rows.map((row) => `| [[${toDisplayName(row.name)}]] | ${row.counts.total} | ${row.counts.open} |`),
        '',
    ]

    return {
        segments: [toSlug(milestone.name, milestone.id), `${toDisplayName(milestone.name)}.md`],
        content: lines.join('\n'),
    }
}
