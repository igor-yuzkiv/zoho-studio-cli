/**
 * The action types Zoho exposes under `settings/automation`. The name is both the path segment and
 * the key the payload arrives under, which is why one list is enough to describe them.
 */
export const workflowActionTypes = ['email_notifications', 'field_updates', 'tasks', 'webhooks', 'functions'] as const

export type WorkflowActionType = (typeof workflowActionTypes)[number]

/** A workflow action as Zoho returns it — the named fields are the ones the CLI relies on. */
export interface ZohoWorkflowAction {
    id: string
    name: string
    module?: {
        api_name?: string
        [field: string]: unknown
    }
    [field: string]: unknown
}
