import { getProjectSettings } from '@zoho-studio/core'
import { createCommandLogger } from '@zoho-studio/core'
import type { PullProgress, PullResult } from '@zoho-studio/core'

import { getMilestonesList } from '../api'
import { writeMilestone } from '../milestone.utils'

export async function pullMilestones(progress: PullProgress): Promise<PullResult> {
    const logger = await createCommandLogger('z-projects:milestones:pull')
    logger.info('Starting milestones pull')

    const { projectPath } = await getProjectSettings()
    const milestones = await getMilestonesList()

    logger.info({ milestones: milestones.length }, 'Milestones found')

    progress.start(milestones.length)

    try {
        for (const milestone of milestones) {
            progress.update(milestone.name)

            const segments = await writeMilestone(projectPath, milestone)

            logger.debug({ id: milestone.id, path: segments.join('/') }, 'Milestone saved')
            progress.increment()
        }
    } finally {
        progress.stop()
    }

    logger.info({ saved: milestones.length }, 'Milestones pull finished')

    return {
        summary: [`Milestones found: ${milestones.length}`, `Milestones saved: ${milestones.length}`],
        failedCount: 0,
    }
}
