import { Command } from 'commander'

import { createCliPullProgress, printPullResult } from '@/shared/pull'
import { pullGlobalPicklists } from '@/zoho-crm/entities/global-picklist'

export const pullGlobalPicklistsCommand = new Command('z-crm:global-picklists:pull')
    .description('Download every Zoho CRM global picklist, with its values, into the project')
    .action(async () => {
        printPullResult(await pullGlobalPicklists(createCliPullProgress('global picklists')))
    })
