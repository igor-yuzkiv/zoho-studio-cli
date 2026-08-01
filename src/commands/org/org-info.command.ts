import { Command } from 'commander'

import { printOrganization, pullOrganization } from '@/entities/organization'

export const orgInfoCommand = new Command('org:info')
    .description('Show the Zoho organization and store it in the project')
    .option('--json', 'print the organization exactly as Zoho returned it', false)
    .action(async (options: { json: boolean }) => {
        const snapshot = await pullOrganization()

        if (options.json) {
            console.log(JSON.stringify(snapshot.organization, null, 4))
            return
        }

        printOrganization(snapshot)
    })
