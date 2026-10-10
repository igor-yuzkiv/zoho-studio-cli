import { resolveWorkspaceOrganizationPath } from '@zoho-studio/core'
import type { Organization } from './organization.types'
import { writeJsonFile } from '@zoho-studio/core'

/** Stores the org record as Zoho returned it and answers with the file it wrote. */
export async function saveProjectOrganization(projectPath: string, organization: Organization): Promise<string> {
    const organizationPath = resolveWorkspaceOrganizationPath(projectPath)

    await writeJsonFile(organizationPath, organization)

    return organizationPath
}
