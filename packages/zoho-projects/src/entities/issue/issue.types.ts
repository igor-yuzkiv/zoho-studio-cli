import type { ZohoPerson } from '../task'

/** A picklist value as Zoho Projects returns it on an issue: severity, reproducibility, and the like. */
export interface ZohoIssueChoice {
    id?: string
    value?: string
}

/** An issue as Zoho Projects returns it from `issues` — the named fields are the ones the CLI relies on. */
export interface ZohoIssue {
    id: string
    name: string
    prefix?: string
    project?: { id?: string; name?: string }
    /** HTML; absent when the issue has no description. */
    description?: string
    flag?: string
    status?: { name?: string; is_closed_type?: boolean }
    severity?: ZohoIssueChoice
    classification?: ZohoIssueChoice
    is_it_reproducible?: ZohoIssueChoice
    module?: ZohoIssueChoice
    /** Zoho fills an unassigned issue with a placeholder person named "Unassigned User". */
    assignee?: ZohoPerson
    created_by?: ZohoPerson
    created_time?: string
    /** ISO timestamp; the period filter of `z-projects:issues:pull` reads it. */
    last_updated_time?: string
    completed_time?: string
    due_date?: string
    tags?: { name: string }[]
    [field: string]: unknown
}

/** An issue comment as Zoho Projects returns it — the named fields are the ones the CLI relies on. */
export interface ZohoIssueComment {
    id: string
    /** HTML. */
    comment?: string
    created_time?: string
    /** The author; issue comments name it `added_by` where task comments say `created_by`. */
    added_by?: ZohoPerson
    [field: string]: unknown
}

export interface TreeIssue {
    record: ZohoIssue
    comments: ZohoIssueComment[]
}
