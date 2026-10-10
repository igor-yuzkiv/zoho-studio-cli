import { getProjectsList } from '../../../api'

import type { ZohoMilestone } from '../milestone.types'

/** Returns every milestone of the configured project; the endpoint is `phases`, the list key `milestones`. */
export function getMilestonesList(): Promise<ZohoMilestone[]> {
    return getProjectsList<ZohoMilestone>('phases', 'milestones')
}
