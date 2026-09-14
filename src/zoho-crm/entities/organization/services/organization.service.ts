import { getProjectSettings, saveProjectOrganization } from '@/settings'

import { getOrganization } from '../api'
import type { Organization } from '../organization.types'

export interface OrganizationSnapshot {
    projectPath: string
    organizationPath: string
    organization: Organization
}

/** Pulls the organization from Zoho and stores it in the project. */
export async function pullOrganization(): Promise<OrganizationSnapshot> {
    const { projectPath } = await getProjectSettings()
    const organization = await getOrganization()
    const organizationPath = await saveProjectOrganization(projectPath, organization)

    return { projectPath, organizationPath, organization }
}
