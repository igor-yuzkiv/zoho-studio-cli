import { crmClient } from '@/shared/api/crm'

import type { ZohoWorkflowRule } from '../workflow-rule.types'

interface WorkflowRulesListInfo {
    more_records?: boolean
}

interface WorkflowRulesListPayload {
    workflow_rules?: ZohoWorkflowRule[]
    info?: WorkflowRulesListInfo
}

export interface WorkflowRulesPageParams {
    per_page: number
    page: number
    module?: string
}

const workflowRulesPerPage = 200
const maxPages = 100

interface WorkflowRulesPage {
    workflowRules: ZohoWorkflowRule[]
    info: WorkflowRulesListInfo
}

/** Returns a single page of workflow rules together with the pagination Zoho reports for it. */
export async function getWorkflowRulesPage(params: WorkflowRulesPageParams): Promise<WorkflowRulesPage> {
    const { data } = await crmClient.get<WorkflowRulesListPayload>('/settings/automation/workflow_rules', { params })

    // A 204 answer leaves no payload at all, so an absent list simply means an empty page.
    return { workflowRules: data?.workflow_rules ?? [], info: data?.info ?? {} }
}

/**
 * Returns every workflow rule, of one module when asked. Zoho paginates this endpoint by page
 * number only — it reports no page token, so there is nothing else to follow.
 */
export async function getWorkflowRulesList(module?: string): Promise<ZohoWorkflowRule[]> {
    const workflowRules: ZohoWorkflowRule[] = []

    for (let page = 1; page <= maxPages; page += 1) {
        const currentPage = await getWorkflowRulesPage({ per_page: workflowRulesPerPage, page, module })

        workflowRules.push(...currentPage.workflowRules)

        if (!currentPage.info.more_records) {
            return workflowRules
        }
    }

    throw new Error(`Zoho CRM kept reporting more workflow rules after ${maxPages} pages.`)
}
