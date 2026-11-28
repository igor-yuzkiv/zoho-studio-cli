import { Command } from 'commander'

import { createCliPullProgress, reportPullResult } from '@zoho-studio/core'
import { pullProfiles } from '@zoho-studio/zoho-crm/profile'

export const pullProfilesCommand = new Command('z-crm:profiles:pull')
    .description('Download every Zoho CRM profile into the project')
    .action(async () => {
        reportPullResult(await pullProfiles(createCliPullProgress('profiles')))
    })
