import { logsDirName } from '@/config'

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
            'ZohoCRM.settings.client_scripts.READ',
            'ZohoCRM.settings.static_resources.READ',
            'ZohoCRM.settings.ALL',
            'ZohoProjects.milestones.READ',
            'ZohoProjects.tasklists.READ',
            'ZohoProjects.tasks.READ',
            'ZohoProjects.bugs.READ',
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
    logs: {
        file: `${logsDirName}/zoho-studio-cli.log`,
    },
    projects: {
        baseUrl: 'https://projectsapi.zoho.com',
        portalId: '',
        projectId: '',
        mdPath: '',
    },
    presets: {
        'pull-crm': [
            'z-crm:org:info',
            'z-crm:modules:pull',
            'z-crm:fields:pull',
            'z-crm:functions:pull',
            'z-crm:workflows:pull',
            'z-crm:workflow-actions:pull',
            'z-crm:webhooks:pull',
            'z-crm:global-picklists:pull',
            'z-crm:client-scripts:pull',
            'z-crm:static-resources:pull',
        ],
        'pull-render-projects': [
            'z-projects:milestones:pull',
            'z-projects:task-lists:pull',
            'z-projects:tasks:pull',
            'z-projects:issues:pull',
            'z-projects:tasks:render',
            'z-projects:issues:render',
        ],
    },
}
