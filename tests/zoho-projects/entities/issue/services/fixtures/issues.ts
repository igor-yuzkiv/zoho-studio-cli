import type { IssueRenderContext, TreeIssue, ZohoIssue } from '@/zoho-projects/entities/issue'
import type { TreeTask } from '@/zoho-projects/entities/task'

export const projects = { portalId: '100', projectId: '200' }

export const timeout: ZohoIssue = {
    id: '510000',
    prefix: 'QA7-I51',
    name: 'Login timeout on the &amp;amp; page',
    description: '<div>Sessions drop after ten minutes.<br></div><div><img src="https://example.test/shot.png"></div>',
    flag: 'Internal',
    status: { name: 'Open', is_closed_type: false },
    severity: { id: '1', value: 'Major' },
    is_it_reproducible: { id: '2', value: 'Always' },
    assignee: { name: 'Unassigned User', email: 'Unassigned User' },
    created_by: { name: 'Olena', email: 'olena@example.test' },
    created_time: '2026-03-01T10:00:00.000Z',
    last_updated_time: '2026-03-02T11:30:00.000Z',
    tags: [],
}

export const brokenExport: ZohoIssue = {
    id: '520000',
    prefix: 'QA7-I52',
    name: 'Broken export',
    description: '<div>Same root cause as QA7-I51 and the task QA7-T580.</div>',
    status: { name: 'Closed', is_closed_type: true },
    severity: { id: '3', value: 'Critical' },
    assignee: { name: 'Sam', email: 'sam@example.test' },
    created_by: { name: 'Olena', email: 'olena@example.test' },
    created_time: '2026-03-05T08:00:00.000Z',
    last_updated_time: '2026-03-09T16:45:00.000Z',
    completed_time: '2026-03-09T16:45:00.000Z',
    due_date: '2026-03-10T07:00:00.000Z',
    tags: [{ name: 'production' }],
}

export const brokenExportComments = [
    {
        id: '1',
        comment: '<div>Fixed together with <a href="https://projects.zoho.com/portal/acme#zp/projects/200/bug-detail/510000">the timeout</a>. See also QA7-I99.</div>',
        created_time: '2026-03-08T09:00:00.000Z',
        added_by: { full_name: 'Sam Dev', is_client_user: false },
    },
    {
        id: '2',
        comment: '<div>zp[@zpuser#9#Sam Dev]zp still broken for us<br></div>',
        created_time: '2026-03-06T12:15:00.000Z',
        added_by: { full_name: 'Dana Client', is_client_user: true },
    },
]

export const timeoutNode: TreeIssue = { record: timeout, comments: [] }
export const brokenExportNode: TreeIssue = { record: brokenExport, comments: brokenExportComments }

export const upgradeTask: TreeTask = {
    record: {
        id: '580000',
        prefix: 'QA7-T580',
        name: 'Upgrade the export package',
        status: { name: 'Backlog', is_closed_type: false },
    },
    comments: [],
}

export function context(issues: TreeIssue[], tasks: TreeTask[] = []): IssueRenderContext {
    return {
        projects,
        issuesById: new Map(issues.map((issue) => [issue.record.id, issue])),
        tasksById: new Map(tasks.map((task) => [task.record.id, task])),
    }
}
