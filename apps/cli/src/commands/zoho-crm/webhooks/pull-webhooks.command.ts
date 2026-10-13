import { Command } from 'commander'

import { createCliPullProgress, printPullResult } from '@zoho-studio/core'
import { pullWebhooks } from '@zoho-studio/zoho-crm/webhook'

export const pullWebhooksCommand = new Command('z-crm:webhooks:pull')
    .description('Download every Zoho CRM webhook, with its request body and authentication, into the project')
    .action(async () => {
        printPullResult(await pullWebhooks(createCliPullProgress('webhooks')))
    })
