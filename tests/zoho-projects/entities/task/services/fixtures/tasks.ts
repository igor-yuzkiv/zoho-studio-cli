import type { TreeMilestone } from '@/zoho-projects/entities/milestone'
import type { TreeTaskList } from '@/zoho-projects/entities/task-list'
import type { TaskRenderContext, TreeStatus, TreeTask, ZohoTask } from '@/zoho-projects/entities/task'

export const projects = { portalId: '100', projectId: '200' }

export const milestone: TreeMilestone = { id: '11', name: 'Pilot', record: null, taskLists: [] }
// Tree names arrive decoded from the loader; the raw record below still carries Zoho's encoding.
export const taskList: TreeTaskList = {
    id: '21',
    name: 'Phase 22: Technical Maintenance & Platform Updates',
    milestoneId: '11',
    record: null,
    statuses: [],
}
export const backlog: TreeStatus = { name: 'Backlog', isClosed: false, tasks: [] }
export const closed: TreeStatus = { name: 'Closed', isClosed: true, tasks: [] }

export const upgrade: ZohoTask = {
    id: '580000',
    prefix: 'SS5-T580',
    name: 'Upgrade MongoDB / laravel-mongodb Package',
    description:
        '<div>From: <a href="https://projects.zoho.com/portal/acme#zp/task-detail/440000">SS5-T440</a></div><div><br /></div><div>Upgrade the MongoDB / laravel-mongodb package to a stable and compatible version</div>',
    status: { name: 'Backlog', is_closed_type: false },
    priority: 'none',
    task_type: 'Task',
    milestone: { id: '11', name: 'Pilot' },
    tasklist: { id: '21', name: 'Phase 22: Technical Maintenance &amp; Platform Updates' },
    owners_and_work: { owners: [{ name: 'Sam', email: 'sam@example.test' }] },
    created_by: { name: 'Alex', email: 'alex@example.test' },
    created_time: '2026-02-26T15:37:20.263Z',
    last_modified_time: '2026-02-26T15:39:13.663Z',
    start_date: '2026-02-26T15:37:00.000Z',
    end_date: '2026-02-27T15:37:00.000Z',
    completion_percentage: 0,
    tags: [],
    log_hours: { total_hours: '00:00' },
    association_info: { has_comments: false, has_subtasks: false },
}

export const routeShift: ZohoTask = {
    id: '697000',
    prefix: 'SS5-T697',
    name: 'Route Shift Windows not populating',
    description:
        '<div><a data-mention="1" href="/portal/acme#zp/projects/200/user-details/1">Alex Park</a>&nbsp;<br /></div><div><br /></div><div>Since today the shift windows are set to None.</div>',
    status: { name: 'Closed', is_closed_type: true },
    priority: 'none',
    milestone: { id: '11', name: 'Pilot' },
    tasklist: { id: '21', name: 'Phase 22: Technical Maintenance &amp; Platform Updates' },
    owners_and_work: {
        owners: [
            { name: 'Sam', email: 'sam@example.test' },
            { name: 'Dana', email: 'dana@client.test' },
        ],
    },
    created_by: { name: 'Dana', email: 'dana@client.test' },
    created_time: '2026-08-03T15:19:02.904Z',
    last_modified_time: '2026-08-18T12:26:55.076Z',
    start_date: '2026-08-03T15:19:00.000Z',
    end_date: '2026-08-04T09:19:00.000Z',
    completed_on: '2026-08-18T12:26:55.076Z',
    completion_percentage: 100,
    tags: [{ name: 'doc updated' }],
    log_hours: { total_hours: '00:40' },
    association_info: { has_comments: true, has_subtasks: false },
    dependency_info: { predecessor: [{ id: '580000' }] },
}

export const routeShiftComments = [
    {
        id: '1',
        comment: '<div>zp[@zpuser#9#Alex Park]zp<br /><br />This is working for us, see SS5-T580 and SS5-T999.</div>',
        created_time: '2026-08-04T12:28:11.000Z',
        created_by: { full_name: 'Dana Client', is_client_user: true },
    },
    {
        id: '2',
        comment:
            '<div>The <b>Route Shift Window</b> is filled by a client script.</div><div><img src="https://files.test/shot.png" /></div>',
        created_time: '2026-08-04T09:21:00.000Z',
        created_by: { full_name: 'Alex Park', is_client_user: false },
    },
]

export function context(status: TreeStatus, tasks: TreeTask[]): TaskRenderContext {
    return { projects, milestone, taskList, status, tasksById: new Map(tasks.map((task) => [task.record.id, task])) }
}

export const upgradeNode: TreeTask = { record: upgrade, comments: [] }
export const routeShiftNode: TreeTask = { record: routeShift, comments: routeShiftComments }
