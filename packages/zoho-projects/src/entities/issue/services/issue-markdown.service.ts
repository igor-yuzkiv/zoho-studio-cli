import { htmlToMarkdown, tasksCrossLinkSource, type TreeTask } from '../../task'
import {
    cleanName,
    type CrossLinkSource,
    type ProjectRef,
    renderCommentBlock,
    renderFrontmatter,
    resolveCrossLinks,
    sortCommentsNewestFirst,
    toPersonEntry,
    toSlug,
    zohoProjectsUrl,
    type ZohoPersonLike,
} from '../../../md'
import { issuesDirName } from '../../../zoho-projects.config'

import type { TreeIssue, ZohoIssueChoice } from '../issue.types'
import { issueFileBaseName, unassignedPlaceholder } from '../issue.utils'

export interface RenderedIssue {
    /** Path segments below `md/`: `issues`, status slug, `<n>-<slug>.md`. */
    segments: string[]
    content: string
}

/** The lookups the cross-links may point at: every pulled issue and every pulled task. */
export interface IssueRenderContext {
    projects: ProjectRef
    issuesById: Map<string, TreeIssue>
    tasksById: Map<string, TreeTask>
}

export function renderIssue(treeIssue: TreeIssue, context: IssueRenderContext): RenderedIssue {
    const issue = treeIssue.record
    const name = cleanName(issue.name)
    const url = zohoProjectsUrl(context.projects, 'bug-detail', issue.id)
    const statusName = issue.status?.name ?? 'Unknown'
    const description = htmlToMarkdown(issue.description ?? '')
    const comments = sortCommentsNewestFirst(treeIssue.comments)
    const commentBodies = comments.map((comment) => htmlToMarkdown(comment.comment ?? ''))
    const crossLinks = resolveCrossLinks(issue, [description, ...commentBodies], [], [
        issuesCrossLinkSource(context.issuesById),
        tasksCrossLinkSource(context.tasksById),
    ])
    const relatedIssues: string[] = []
    const relatedTasks: string[] = []

    for (const link of crossLinks) {
        if (link.target) {
            ;(context.issuesById.has(link.target.id) ? relatedIssues : relatedTasks).push(link.target.fileBaseName)
        }
    }

    const frontmatter = {
        type: 'issue',
        id: issue.id,
        prefix: issue.prefix ?? null,
        name,
        url,
        status: statusName,
        is_closed: issue.status?.is_closed_type === true,
        severity: choiceValue(issue.severity),
        classification: choiceValue(issue.classification),
        reproducible: choiceValue(issue.is_it_reproducible),
        module: choiceValue(issue.module),
        flag: issue.flag ?? null,
        assignee: toAssigneeEntry(issue.assignee),
        created_by: issue.created_by ? toPersonEntry(issue.created_by) : null,
        created_time: issue.created_time ?? null,
        last_updated_time: issue.last_updated_time ?? null,
        completed_time: issue.completed_time ?? null,
        due_date: issue.due_date ?? null,
        tags: (issue.tags ?? []).map((tag) => tag.name),
        comments_count: treeIssue.comments.length,
        related_issues: relatedIssues,
        related_tasks: relatedTasks,
    }

    const lines = [
        renderFrontmatter(frontmatter),
        '',
        `# ${issue.prefix ? `${issue.prefix}: ` : ''}${name}`,
        '',
        `[Open in Zoho](${url})`,
        '',
        '## Description',
        '',
        description || '_(empty)_',
        '',
        '## Cross links',
        '',
        crossLinks.length > 0 ? crossLinks.map((link) => `- ${link.line}`).join('\n') : '_(none)_',
        '',
        '## Comments',
        '',
        comments.length > 0
            ? comments
                  .map((comment, index) => renderCommentBlock(comment.created_time, comment.added_by, commentBodies[index]!))
                  .join('\n\n')
            : '_(no comments)_',
        '',
    ]

    return {
        segments: [issuesDirName, toSlug(statusName, 'unknown'), `${issueFileBaseName(issue)}.md`],
        content: lines.join('\n'),
    }
}

/** Every pulled issue as a cross-link target. */
export function issuesCrossLinkSource(issuesById: Map<string, TreeIssue>): CrossLinkSource {
    return {
        label: 'issue',
        prefixLetter: 'I',
        urlKind: 'bug-detail',
        targets: [...issuesById.values()].map(({ record }) => ({
            id: record.id,
            prefix: record.prefix ?? null,
            name: record.name,
            status: record.status?.name ?? null,
            fileBaseName: issueFileBaseName(record),
        })),
    }
}

function choiceValue(choice: ZohoIssueChoice | undefined): string | null {
    return choice?.value ?? null
}

function toAssigneeEntry(assignee: ZohoPersonLike | undefined): { name: string | null; email: string | null } | null {
    if (!assignee || assignee.name === unassignedPlaceholder) {
        return null
    }

    return toPersonEntry(assignee)
}
