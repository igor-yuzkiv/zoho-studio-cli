import type { TreeStatus } from '../task'

/** A task list as Zoho Projects returns it — the named fields are the ones the CLI relies on. */
export interface ZohoTaskList {
    id: string
    name: string
    /** Task lists outside any milestone point at a pseudo-milestone named "None" that `phases` never returns. */
    milestone?: { id: string; name: string }
    meta_info?: { is_none_milestone_tasklist?: boolean; [field: string]: unknown }
    created_time?: string
    last_updated_time?: string
    [field: string]: unknown
}

/** A task list in the rendered tree; `record` is null when a task named it but no pull wrote its JSON. */
export interface TreeTaskList {
    id: string
    name: string
    milestoneId: string
    record: ZohoTaskList | null
    statuses: TreeStatus[]
}
