import type { ProjectConfig } from '@/config/types.ts'

export const ProjectDefaultConfig: ProjectConfig = {
    auth: {
        baseUrl: 'https://accounts.zoho.com',
        clientId: '',
        clientSecret: '',
        scopes: [
            'ZohoCRM.settings.modules.READ',
            'ZohoCRM.settings.fields.READ',
            'ZohoCRM.settings.workflow_rules.READ',
            'ZohoCRM.settings.functions.READ',
            'ZohoCRM.org.READ',
        ],
        accessToken: '',
        refreshToken: '',
        accessTokenExpiresAt: 0,
    },
    api: {
        baseUrl: 'https://www.zohoapis.com',
        version: 'v8',
    },
}
