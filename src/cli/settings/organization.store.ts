import { resolveWorkspaceOrganizationPath } from '@/config'
import type { Organization } from '@/zoho-crm/entities/organization'
import { writeJsonFile } from '@/shared/utils'

/** Stores the org record as Zoho returned it and answers with the file it wrote. */
export async function saveProjectOrganization(projectPath: string, organization: Organization): Promise<string> {
    const organizationPath = resolveWorkspaceOrganizationPath(projectPath)

    await writeJsonFile(organizationPath, organization)

    return organizationPath
}
