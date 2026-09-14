import { describeRequestError } from '@/shared/api/crm'

import { workflowActionTypes, type WorkflowActionType } from './workflow-action.types'

/** `--type` names both a Zoho endpoint and a local directory, so both spellings are accepted. */
export function assertWorkflowActionType(value: string): WorkflowActionType {
    const type = value.replace(/-/g, '_') as WorkflowActionType

    if (!workflowActionTypes.includes(type)) {
        throw new Error(`--type must be one of ${workflowActionTypes.join(', ')}, got "${value}".`)
    }

    return type
}

/** Zoho names the type with underscores; the project keeps directories in the kebab-case it uses elsewhere. */
export function toWorkflowActionDirName(type: WorkflowActionType): string {
    return type.replace(/_/g, '-')
}

/**
 * A scope the token never had reads as an ordinary rejection, although the fix is a settings change
 * followed by a new login rather than anything about this command.
 */
export function describePullError(error: unknown): string {
    const message = describeRequestError(error)

    return message.includes('OAUTH_SCOPE_MISMATCH')
        ? `${message} — add "ZohoCRM.settings.automation_actions.READ" to auth.scopes in .zoho-studio/settings.json and run "zoho-studio login" again.`
        : message
}
