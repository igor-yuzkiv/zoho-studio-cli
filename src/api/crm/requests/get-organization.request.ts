import { crmClient } from '../crm.client'
import type { Organization } from '../crm.types'

interface OrganizationPayload {
    org?: Organization[]
}

export async function getOrganization(): Promise<Organization> {
    const { data } = await crmClient.get<OrganizationPayload>('/org')
    const organization = data?.org?.[0]

    if (!organization) {
        throw new Error('Zoho CRM returned no organization.')
    }

    return organization
}
