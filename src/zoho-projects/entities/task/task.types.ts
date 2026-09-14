export interface ZohoPerson {
    name?: string
    full_name?: string
    email?: string
    is_client_user?: boolean
}

/** A task as Zoho Projects returns it — the named fields are the ones the CLI relies on. */
export interface ZohoTask {
    id: string
    name: string
    prefix?: string
    project?: { id?: string; name?: string }
    description?: string
    tasklist?: { id: string; name: string }
    milestone?: { id: string; name: string }
    status?: { name?: string; is_closed_type?: boolean }
    priority?: string
    task_type?: string
    owners_and_work?: { owners?: ZohoPerson[] }
    created_by?: ZohoPerson
    created_time?: string
    /** ISO timestamp; the period filter of `z-projects:tasks:pull` reads it. */
    last_modified_time?: string
    start_date?: string
    end_date?: string
    completed_on?: string
    completion_percentage?: number
    tags?: { name: string }[]
    log_hours?: { total_hours?: string }
    association_info?: { has_comments?: boolean; has_subtasks?: boolean }
    dependency_info?: { predecessor?: { id: string }[]; successor?: { id: string }[] }
    [field: string]: unknown
}

/** A task comment as Zoho Projects returns it — the named fields are the ones the CLI relies on. */
export interface ZohoTaskComment {
    id: string
    comment?: string
    created_time?: string
    created_by?: ZohoPerson
    [field: string]: unknown
}

export interface TreeTask {
    record: ZohoTask
    comments: ZohoTaskComment[]
}

export interface TreeStatus {
    name: string
    isClosed: boolean
    tasks: TreeTask[]
}
