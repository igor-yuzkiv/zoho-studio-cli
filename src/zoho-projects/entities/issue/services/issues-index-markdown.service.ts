import type { IndexRenderContext, RenderedIndex } from '@/zoho-projects/entities/milestone'
import { cleanName, renderFrontmatter } from '@/zoho-projects/md'
import { issuesDirName } from '@/zoho-projects/zoho-projects.config'

import type { TreeIssue } from '../issue.types'
import { issueFileBaseName, unassignedPlaceholder } from '../issue.utils'

export const issuesIndexFileName = 'Issues.md'

/** One table over every issue in `raw/`, in the order the loader gives: open first, then by number. */
export function renderIssuesIndex(issues: TreeIssue[], context: IndexRenderContext): RenderedIndex {
    const closed = issues.filter((issue) => issue.record.status?.is_closed_type === true).length

    const frontmatter = {
        type: 'issues-index',
        project_id: context.projects.projectId,
        project: context.projectName,
        issues_rendered: issues.length,
        issues_open: issues.length - closed,
        issues_closed: closed,
        rendered_at: context.renderedAt,
    }

    const lines = [
        renderFrontmatter(frontmatter),
        '',
        '# Issues',
        '',
        '| Issue | Status | Severity | Assignee | Created |',
        '|---|---|---|---|---|',
        ...issues.map(({ record }) => {
            const label = `${record.prefix ? `${record.prefix} ` : ''}${cleanName(record.name)}`.replace(/\|/g, '-')
            const assignee = record.assignee?.name === unassignedPlaceholder ? '' : (record.assignee?.name ?? '')

            return `| [[${issueFileBaseName(record)}\\|${label}]] | ${record.status?.name ?? 'Unknown'} | ${record.severity?.value ?? ''} | ${assignee} | ${record.created_time?.slice(0, 10) ?? ''} |`
        }),
        '',
    ]

    return { segments: [issuesDirName, issuesIndexFileName], content: lines.join('\n') }
}
