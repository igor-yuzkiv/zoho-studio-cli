import { projectSettingsDirName } from '@/config'

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
            'ZohoCRM.modules.ALL',
            'ZohoCRM.apis.READ',
            'ZohoCRM.settings.automation_actions.READ',
            'ZohoCRM.settings.global_picklist.READ',
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
    crm: {
        functions: {
            root_dir: 'functions',
            code_extension: 'deluge',
        },
        modules: {
            root_dir: 'modules',
        },
        workflows: {
            root_dir: 'workflows',
        },
    },
    logs: {
        file: `${projectSettingsDirName}/cli.log`,
    },
}
