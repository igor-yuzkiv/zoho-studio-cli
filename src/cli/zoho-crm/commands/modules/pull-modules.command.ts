import { Command } from 'commander'

import { printPullResult, silentPullProgress } from '@/shared/pull'
import { pullModules } from '@/zoho-crm/entities/module'

export const pullModulesCommand = new Command('z-crm:modules:pull')
    .description('Download the metadata of every Zoho CRM module into the project modules directory')
    .action(async () => {
        printPullResult(await pullModules(silentPullProgress))
    })
