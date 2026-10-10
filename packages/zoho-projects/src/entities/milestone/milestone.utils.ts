import { noMilestoneDirName, rawDirName, zohoProjectsDirName } from '../../zoho-projects.config'
import { findRawEntitySegments, RawEntityResolver, writeRawEntity } from '../../raw'

import { getMilestonesList } from './api'
import type { ZohoMilestone } from './milestone.types'

export const milestonesParentSegments = [zohoProjectsDirName, rawDirName]

/** Where task lists outside any milestone go — Zoho's "None" pseudo-milestone never comes back from `phases`. */
export const noMilestoneSegments = [...milestonesParentSegments, noMilestoneDirName]

export function writeMilestone(projectPath: string, milestone: ZohoMilestone): Promise<string[]> {
    return writeRawEntity(projectPath, milestonesParentSegments, milestone)
}

export type MilestoneResolver = RawEntityResolver<ZohoMilestone>

/** Returns milestone folders by id, fetching and writing a milestone no earlier pull has. */
export function createMilestoneResolver(projectPath: string): MilestoneResolver {
    return new RawEntityResolver<ZohoMilestone>({
        entityName: 'Milestone',
        fetchList: getMilestonesList,
        findLocal: (id) => findRawEntitySegments(projectPath, milestonesParentSegments, id),
        write: (milestone) => writeMilestone(projectPath, milestone),
    })
}
