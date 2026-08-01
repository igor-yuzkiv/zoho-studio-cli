import { crmClient } from '@/shared/api/crm'

import type { WorkflowActionType, ZohoWorkflowAction } from '../workflow-action.types'

type WorkflowActionPayload = Partial<Record<WorkflowActionType, ZohoWorkflowAction[]>>

/**
 * Returns the full record of one action — for webhooks its body, headers and authentication, for
 * email notifications its recipients, for functions its arguments, none of which the list carries.
 *
 * Returns null when Zoho answers with an empty 204. That is how it reports an unknown id, but it
 * also happens for actions that the list endpoint returns quite normally, so the caller decides
 * what an absent record means rather than being handed an error.
 */
export async function getWorkflowAction(type: WorkflowActionType, id: string): Promise<ZohoWorkflowAction | null> {
    const { data } = await crmClient.get<WorkflowActionPayload>(`/settings/automation/${type}/${id}`)

    return data?.[type]?.[0] ?? null
}
