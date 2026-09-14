import { rawDirName, zohoProjectsDirName } from '@/zoho-projects/zoho-projects.config'
import { findRawEntityDir, writeRawEntity } from '@/zoho-projects/raw'

import type { ZohoMilestone } from './milestone.types'

export const milestonesParentSegments = [zohoProjectsDirName, rawDirName]

/** Returns the segments of the milestone's folder, written or updated in place. */
export function writeMilestone(projectPath: string, milestone: ZohoMilestone): Promise<string[]> {
    return writeRawEntity(projectPath, milestonesParentSegments, milestone)
}

/** Returns the segments of the milestone's folder when a previous pull already wrote it. */
export async function findMilestoneSegments(projectPath: string, milestoneId: string): Promise<string[] | null> {
    const dirName = await findRawEntityDir(projectPath, milestonesParentSegments, milestoneId)

    return dirName ? [...milestonesParentSegments, dirName] : null
}
