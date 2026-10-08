import { Command } from 'commander'

import { createCliPullProgress, printPullResult } from '@/shared/pull'
import { pullClientScripts } from '@/zoho-crm/entities/client-script'

export const pullClientScriptsCommand = new Command('z-crm:client-scripts:pull')
    .description('Download every Zoho CRM client script into the project client scripts directory')
    .action(async () => {
        printPullResult(await pullClientScripts(createCliPullProgress('client script pages')))
    })
