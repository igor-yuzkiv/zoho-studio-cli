import type { ArtifactListConfig } from './ArtifactListView.vue'

/** The folder right below the group, such as the action type or the resource source. */
function sectionFromFolder({ path }: { path: string }): string {
    return path.split('/')[2] ?? ''
}

export const artifactListConfigs: Record<string, ArtifactListConfig> = {
    'workflow-actions': {
        groupId: 'workflow-actions',
        relativePath: 'zoho-crm/workflow-actions',
        metadataSuffix: '.json',
        sectionOf: sectionFromFolder,
    },
    webhooks: {
        groupId: 'webhooks',
        relativePath: 'zoho-crm/webhooks',
        metadataSuffix: '.json',
    },
    'global-picklists': {
        groupId: 'global-picklists',
        relativePath: 'zoho-crm/global-picklists',
        metadataSuffix: '.json',
    },
    'client-scripts': {
        groupId: 'client-scripts',
        relativePath: 'zoho-crm/client-scripts',
        metadataSuffix: '.metadata.json',
        // page.metadata.json describes the page the scripts run on, not a script.
        isArtifact: ({ fileName }) => fileName !== 'page.metadata.json',
        sourcePathOf: ({ path }) => path.replace(/\.metadata\.json$/, '.js'),
        sourceLanguage: 'javascript',
        sectionOf: ({ path }) => path.split('/').slice(2, 4).join(' / '),
    },
    'static-resources': {
        groupId: 'static-resources',
        relativePath: 'zoho-crm/static-resources',
        metadataSuffix: '.metadata.json',
        sourcePathOf: ({ directory, value }) => {
            const fileName = typeof value.file_name === 'string' ? value.file_name : null

            // Compressed bundles are binary; only readable text is offered as source.
            return fileName && /\.(js|css|html|json|txt|svg)$/.test(fileName) ? `${directory}/${fileName}` : null
        },
        sourceLanguage: 'javascript',
        sectionOf: sectionFromFolder,
    },
}
