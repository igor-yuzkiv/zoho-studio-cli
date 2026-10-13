import { Command } from 'commander'

import { createCliPullProgress, printPullResult } from '@zoho-studio/core'
import { pullProfiles } from '@zoho-studio/zoho-crm/profile'

export const pullProfilesCommand = new Command('z-crm:profiles:pull')
    .description('Download every Zoho CRM profile into the project')
    .action(async () => {
        printPullResult(await pullProfiles(createCliPullProgress('profiles')))
    })
