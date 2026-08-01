import { crmClient } from '@/shared/api/crm'

import type { WorkflowActionType, ZohoWorkflowAction } from '../workflow-action.types'

interface WorkflowActionsListInfo {
    more_records?: boolean
}

type WorkflowActionsListPayload = Partial<Record<WorkflowActionType, ZohoWorkflowAction[]>> & {
    info?: WorkflowActionsListInfo
}

export interface WorkflowActionsPageParams {
    per_page: number
    page: number
    module?: string
}

const workflowActionsPerPage = 200
const maxPages = 100

interface WorkflowActionsPage {
    workflowActions: ZohoWorkflowAction[]
    info: WorkflowActionsListInfo
}

/** Returns a single page of one action type together with the pagination Zoho reports for it. */
export async function getWorkflowActionsPage(
    type: WorkflowActionType,
    params: WorkflowActionsPageParams
): Promise<WorkflowActionsPage> {
    const { data } = await crmClient.get<WorkflowActionsListPayload>(`/settings/automation/${type}`, { params })

    // A 204 answer leaves no payload at all, so an absent list simply means an empty page.
    return { workflowActions: data?.[type] ?? [], info: data?.info ?? {} }
}

/**
 * Returns every action of one type, of one module when asked. Zoho paginates these endpoints by
 * page number only — it reports no page token, so there is nothing else to follow.
 */
export async function getWorkflowActionsList(
    type: WorkflowActionType,
    module?: string
): Promise<ZohoWorkflowAction[]> {
    const workflowActions: ZohoWorkflowAction[] = []

    for (let page = 1; page <= maxPages; page += 1) {
        const currentPage = await getWorkflowActionsPage(type, { per_page: workflowActionsPerPage, page, module })

        workflowActions.push(...currentPage.workflowActions)

        if (!currentPage.info.more_records) {
            return workflowActions
        }
    }

    throw new Error(`Zoho CRM kept reporting more "${type}" actions after ${maxPages} pages.`)
}
