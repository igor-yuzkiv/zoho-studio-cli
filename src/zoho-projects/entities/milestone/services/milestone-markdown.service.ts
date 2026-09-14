import { stringify } from 'yaml'

import type { ProjectSettings } from '@/settings'
import { decodeHtmlEntities, toDisplayName, toSlug } from '@/zoho-projects/entities/task'

import type { TreeMilestone } from '../milestone.types'

export interface RenderedIndex {
    /** Path segments below `md/`; the last one is the display name with `.md`. */
    segments: string[]
    content: string
}

export interface IndexRenderContext {
    projects: Pick<ProjectSettings['projects'], 'portalId' | 'projectId'>
    projectName: string | null
    /** The date of the run, `YYYY-MM-DD`. */
    renderedAt: string
}

export function milestoneUrl(projects: IndexRenderContext['projects'], milestoneId: string): string {
    return `https://projects.zoho.com/portal/${projects.portalId}#zp/projects/${projects.projectId}/milestone-detail/${milestoneId}`
}

export function countTasks(taskLists: TreeMilestone['taskLists']): { total: number; open: number; closed: number } {
    let open = 0
    let closed = 0

    for (const taskList of taskLists) {
        for (const status of taskList.statuses) {
            if (status.isClosed) {
                closed += status.tasks.length
            } else {
                open += status.tasks.length
            }
        }
    }

    return { total: open + closed, open, closed }
}

export function renderMilestoneIndex(milestone: TreeMilestone, context: IndexRenderContext): RenderedIndex {
    const name = decodeHtmlEntities(milestone.name).trim()
    const url = milestoneUrl(context.projects, milestone.id)
    const counts = countTasks(milestone.taskLists)
    const rows = [...milestone.taskLists]
        .map((taskList) => ({ name: decodeHtmlEntities(taskList.name).trim(), counts: countTasks([taskList]) }))
        .sort((left, right) => left.name.localeCompare(right.name))

    const frontmatter = {
        type: 'milestone',
        id: milestone.id,
        name,
        url,
        project_id: context.projects.projectId,
        project: context.projectName,
        tasks_rendered: counts.total,
        tasks_open: counts.open,
        tasks_closed: counts.closed,
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
        '| Tasklist | Tasks | Open |',
        '|---|---|---|',
        ...rows.map((row) => `| [[${toDisplayName(row.name)}]] | ${row.counts.total} | ${row.counts.open} |`),
        '',
    ]

    return { segments: [toSlug(name), `${toDisplayName(name)}.md`], content: lines.join('\n') }
}
