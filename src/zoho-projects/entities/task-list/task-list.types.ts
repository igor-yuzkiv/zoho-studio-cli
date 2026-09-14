/** A task list as Zoho Projects returns it — the named fields are the ones the CLI relies on. */
export interface ZohoTaskList {
    id: string
    name: string
    /** Task lists outside any milestone point at a pseudo-milestone named "None" that `phases` never returns. */
    milestone?: { id: string; name: string }
    meta_info?: { is_none_milestone_tasklist?: boolean; [field: string]: unknown }
    [field: string]: unknown
}
