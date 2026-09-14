import { noMilestoneDirName, rawDirName, zohoProjectsDirName } from '@/zoho-projects/zoho-projects.config'
import { findRawEntityDir, writeRawEntity } from '@/zoho-projects/raw'

import { getMilestonesList } from './api'
import type { ZohoMilestone } from './milestone.types'

export const milestonesParentSegments = [zohoProjectsDirName, rawDirName]

/** Where task lists outside any milestone go — Zoho's "None" pseudo-milestone never comes back from `phases`. */
export const noMilestoneSegments = [...milestonesParentSegments, noMilestoneDirName]

/** Returns the segments of the milestone's folder, written or updated in place. */
export function writeMilestone(projectPath: string, milestone: ZohoMilestone): Promise<string[]> {
    return writeRawEntity(projectPath, milestonesParentSegments, milestone)
}

/** Returns the segments of the milestone's folder when a previous pull already wrote it. */
export async function findMilestoneSegments(projectPath: string, milestoneId: string): Promise<string[] | null> {
    const dirName = await findRawEntityDir(projectPath, milestonesParentSegments, milestoneId)

    return dirName ? [...milestonesParentSegments, dirName] : null
}

/**
 * Returns the milestone's folder, fetching and writing the milestone when no earlier pull has it.
 * The API offers the list only, so it is fetched once per run and kept for the next lookup.
 */
export class MilestoneResolver {
    private remoteMilestones: Promise<Map<string, ZohoMilestone>> | null = null

    constructor(private readonly projectPath: string) {}

    async resolveSegments(milestoneId: string): Promise<string[]> {
        const local = await findMilestoneSegments(this.projectPath, milestoneId)

        if (local) {
            return local
        }

        const milestone = (await this.fetchRemoteMilestones()).get(milestoneId)

        if (!milestone) {
            throw new Error(`Milestone "${milestoneId}" is not in the project.`)
        }

        return writeMilestone(this.projectPath, milestone)
    }

    private fetchRemoteMilestones(): Promise<Map<string, ZohoMilestone>> {
        this.remoteMilestones ??= getMilestonesList().then(
            (milestones) => new Map(milestones.map((milestone) => [milestone.id, milestone]))
        )

        return this.remoteMilestones
    }
}
