import axios from 'axios'
import { Command } from 'commander'

import { TokenService } from '@/services/auth'
import { getProjectSettings } from '@/settings'

interface OrgResponse {
    org?: { company_name?: string }[]
}

export const debugCommand = new Command('debug')
    .description('Check the stored access token against the Zoho CRM org endpoint')
    .action(async () => {
        const { projectPath, settings } = await getProjectSettings()
        const accessToken = await new TokenService(projectPath, settings).getAccessToken()

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
