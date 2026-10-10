import type { TreeTaskList } from '../task-list'

/** A milestone as Zoho Projects returns it (`phase` in the API) — the named fields are the ones the CLI relies on. */
export interface ZohoMilestone {
    id: string
    name: string
    last_modified_time?: string
    [field: string]: unknown
}

/** A milestone in the rendered tree; `record` is null when a task named it but no pull wrote its JSON. */
export interface TreeMilestone {
    id: string
    name: string
    record: ZohoMilestone | null
    taskLists: TreeTaskList[]
}
