import { crmClient } from '@/shared/api/crm'

import type { ZohoWorkflowRule } from '../workflow-rule.types'

interface WorkflowRulePayload {
    workflow_rules?: ZohoWorkflowRule[]
}

/**
 * Returns the full record of one rule — its conditions and actions, which the list endpoint omits.
 * Zoho answers an unknown id with an empty 204 rather than an error, so that is reported here.
 */
export async function getWorkflowRule(id: string): Promise<ZohoWorkflowRule> {
    const { data } = await crmClient.get<WorkflowRulePayload>(`/settings/automation/workflow_rules/${id}`)
    const workflowRule = data?.workflow_rules?.[0]

    if (!workflowRule) {
        throw new Error(`Zoho CRM returned no workflow rule for id "${id}".`)
    }

    return workflowRule
}
