import { Command } from 'commander'

import { getMilestonesList, writeMilestone } from '@/zoho-projects/entities/milestone'
import { getProjectSettings } from '@/settings'
import { createCommandLogger } from '@/shared/logger'

export const pullMilestonesCommand = new Command('z-projects:milestones:pull')
    .description('Download every milestone of the configured Zoho Projects project as raw JSON')
    .action(async () => {
        const logger = await createCommandLogger('z-projects:milestones:pull')
        logger.info('Starting milestones pull')

        const { projectPath } = await getProjectSettings()
        const milestones = await getMilestonesList()

        logger.info({ milestones: milestones.length }, 'Milestones found')

        for (const milestone of milestones) {
            const segments = await writeMilestone(projectPath, milestone)

            logger.debug({ id: milestone.id, path: segments.join('/') }, 'Milestone saved')
        }

        logger.info({ saved: milestones.length }, 'Milestones pull finished')
        console.log(`Milestones found: ${milestones.length}`)
        console.log(`Milestones saved: ${milestones.length}`)
    })
