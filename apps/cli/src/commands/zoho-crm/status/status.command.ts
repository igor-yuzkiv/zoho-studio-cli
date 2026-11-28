import { Command } from 'commander'

import { getProjectSettings } from '@zoho-studio/core'
import { getOrganizationRequest } from '@zoho-studio/zoho-crm/organization'

import { describeDataCenter } from './status.utils'

export const statusCommand = new Command('z-crm:status')
    .description('Show the Zoho organization the project is connected to')
    .option('--json', 'print the organization exactly as Zoho returned it', false)
    .action(async (options: { json: boolean }) => {
        const organization = await getOrganizationRequest()

        if (options.json) {
            console.log(JSON.stringify(organization, null, 4))
            return
        }

        const { settings } = await getProjectSettings()

        console.log(`Organization: ${organization.company_name ?? 'unknown'}`)
        console.log(`  id: ${organization.id ?? 'unknown'}`)
        console.log(`  type: ${organization.type ?? 'unknown'}`)
        console.log(`  domain: ${organization.domain_name ?? 'unknown'}`)
        console.log(`  data center: ${describeDataCenter(settings.api.baseUrl)}`)
        console.log(`  primary email: ${organization.primary_email ?? 'unknown'}`)
    })
