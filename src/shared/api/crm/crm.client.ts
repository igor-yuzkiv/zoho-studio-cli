import axios from 'axios'

import { tokenService } from '@/shared/api/auth'
import { getProjectSettings } from '@/settings'

const crmClient = axios.create()

crmClient.interceptors.request.use(async (config) => {
    const { settings } = await getProjectSettings()

    config.baseURL = `${settings.api.baseUrl}/crm/${settings.api.version}`
    // Every CRM request is authorized here, so no request has to know about tokens.
    config.headers.set('Authorization', `Zoho-oauthtoken ${await tokenService.getAccessToken()}`)

    return config
})

export { crmClient }
