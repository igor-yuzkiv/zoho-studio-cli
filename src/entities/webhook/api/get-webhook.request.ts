import { crmClient } from '@/shared/api/crm'

import type { ZohoWebhook } from '../webhook.types'

interface WebhookPayload {
    webhooks?: ZohoWebhook[]
}

/**
 * Returns the full record of one webhook — the request body, headers, URL parameters, and
 * authentication, which the list endpoint omits. Zoho answers an unknown id with an empty 204
 * rather than an error, so that is reported here.
 */
export async function getWebhook(id: string): Promise<ZohoWebhook> {
    const { data } = await crmClient.get<WebhookPayload>(`/settings/automation/webhooks/${id}`)
    const webhook = data?.webhooks?.[0]

    if (!webhook) {
        throw new Error(`Zoho CRM returned no webhook for id "${id}".`)
    }

    return webhook
}
