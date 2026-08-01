import { Command } from 'commander'

import { getOrganization } from '@/entities/organization'

export const statusCommand = new Command('status')
    .description('Show the Zoho organization the project is connected to')
    .option('--json', 'print the organization exactly as Zoho returned it', false)
    .action(async (options: { json: boolean }) => {
        const organization = await getOrganization()

        if (options.json) {
            console.log(JSON.stringify(organization, null, 4))
            return
        }

        console.log(`Organization: ${organization.company_name ?? 'unknown'}`)
        console.log(`  id: ${organization.id ?? 'unknown'}`)
        console.log(`  primary email: ${organization.primary_email ?? 'unknown'}`)
    })
