import type { ProjectSettings } from './types'

export const defaultProjectSettings: ProjectSettings = {
    auth: {
        baseUrl: 'https://accounts.zoho.com',
        scopes: [
            'ZohoCRM.settings.modules.READ',
            'ZohoCRM.settings.fields.READ',
            'ZohoCRM.settings.workflow_rules.READ',
            'ZohoCRM.settings.functions.READ',
            'ZohoCRM.org.READ',
        ],
        clientId: '',
        clientSecret: '',
        tokens: {
            accessToken: '',
            refreshToken: '',
            accessTokenExpiresAt: 0,
        },
    },
    api: {
        baseUrl: 'https://www.zohoapis.com',
        version: 'v8',
    },
}
