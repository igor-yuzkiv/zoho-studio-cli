import { crmClient } from '@/shared/api/crm'

import type { ZohoWebhook } from '../webhook.types'

interface WebhooksListInfo {
    more_records?: boolean
}

interface WebhooksListPayload {
    webhooks?: ZohoWebhook[]
    info?: WebhooksListInfo
}

export interface WebhooksPageParams {
    per_page: number
    page: number
}

const webhooksPerPage = 200
const maxPages = 100

interface WebhooksPage {
    webhooks: ZohoWebhook[]
    info: WebhooksListInfo
}

/** Returns a single page of webhooks together with the pagination Zoho reports for it. */
export async function getWebhooksPage(params: WebhooksPageParams): Promise<WebhooksPage> {
    const { data } = await crmClient.get<WebhooksListPayload>('/settings/automation/webhooks', { params })

    // A 204 answer leaves no payload at all, so an absent list simply means an empty page.
    return { webhooks: data?.webhooks ?? [], info: data?.info ?? {} }
}

/**
 * Returns every webhook of the organization. Zoho paginates this endpoint by page number only —
 * it reports no page token, so there is nothing else to follow.
 */
export async function getWebhooksList(): Promise<ZohoWebhook[]> {
    const webhooks: ZohoWebhook[] = []

    for (let page = 1; page <= maxPages; page += 1) {
        const currentPage = await getWebhooksPage({ per_page: webhooksPerPage, page })

        webhooks.push(...currentPage.webhooks)

        if (!currentPage.info.more_records) {
            return webhooks
        }
    }

    throw new Error(`Zoho CRM kept reporting more webhooks after ${maxPages} pages.`)
}
