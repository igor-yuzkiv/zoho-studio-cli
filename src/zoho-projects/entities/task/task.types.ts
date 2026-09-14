/** A task as Zoho Projects returns it — the named fields are the ones the CLI relies on. */
export interface ZohoTask {
    id: string
    name: string
    tasklist?: { id: string; name: string }
    milestone?: { id: string; name: string }
    /** ISO timestamp; the period filter of `z-projects:tasks:pull` reads it. */
    last_modified_time?: string
    [field: string]: unknown
}

/** A task comment as Zoho Projects returns it; the CLI stores it whole and reads nothing but the id. */
export interface ZohoTaskComment {
    id: string
    [field: string]: unknown
}
