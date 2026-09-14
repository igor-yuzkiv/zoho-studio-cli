import axios from 'axios'

import { tokenService } from '@/shared/api/auth'
import { getProjectSettings } from '@/settings'

const projectsClient = axios.create()

projectsClient.interceptors.request.use(async (config) => {
    const { settings } = await getProjectSettings()
    const { baseUrl, portalId, projectId } = settings.projects

    if (!portalId) {
        throw new Error('projects.portalId is empty in .zoho-studio/settings.json.')
    }

    if (!projectId) {
        throw new Error('projects.projectId is empty in .zoho-studio/settings.json.')
    }

    config.baseURL = `${baseUrl}/api/v3/portal/${portalId}/projects/${projectId}`
    config.headers.set('Authorization', `Zoho-oauthtoken ${await tokenService.getAccessToken()}`)

    return config
})

export { projectsClient }
