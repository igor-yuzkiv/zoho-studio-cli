import axios from 'axios'
import { Command } from 'commander'

import { getProjectSettings } from '@/settings'

interface OrgResponse {
    org?: { company_name?: string }[]
}

export const debugCommand = new Command('debug')
    .description('Check the stored access token against the Zoho CRM org endpoint')
    .action(async () => {
        const { settings } = await getProjectSettings()
        const { accessToken } = settings.auth.tokens

        if (!accessToken) {
            throw new Error('No access token stored. Run "zoho-studio login" first.')
        }

        const response = await axios.get<OrgResponse>(
            `${settings.api.baseUrl.replace(/\/+$/, '')}/crm/${settings.api.version}/org`,
            {
                headers: { Authorization: `Zoho-oauthtoken ${accessToken}` },
                validateStatus: () => true,
            }
        )

        console.log(`HTTP ${response.status}`)

        if (response.status >= 400) {
            console.log(JSON.stringify(response.data, null, 4))
            return
        }

        console.log(`Organization: ${response.data.org?.[0]?.company_name ?? 'unknown'}`)
    })
