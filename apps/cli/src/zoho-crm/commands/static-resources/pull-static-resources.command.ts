import { Command } from 'commander'

import { createCliPullProgress, printPullResult } from '@zoho-studio/core'
import { pullStaticResources } from '@zoho-studio/zoho-crm/static-resource'

export const pullStaticResourcesCommand = new Command('z-crm:static-resources:pull')
    .description('Download every Zoho CRM static resource into the project static resources directory')
    .action(async () => {
        printPullResult(await pullStaticResources(createCliPullProgress('static resources')))
    })
