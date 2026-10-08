import { Command } from 'commander'

import { printPullResult, silentPullProgress } from '@/shared/pull'
import { pullMilestones } from '@/zoho-projects/entities/milestone'

export const pullMilestonesCommand = new Command('z-projects:milestones:pull')
    .description('Download every milestone of the configured Zoho Projects project as raw JSON')
    .action(async () => {
        printPullResult(await pullMilestones(silentPullProgress))
    })
