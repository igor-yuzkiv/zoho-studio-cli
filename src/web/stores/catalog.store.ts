import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export type AreaId = 'crm' | 'projects'

export type ArtifactGroup = {
    area: AreaId
    id: string
    label: string
    count: number | null
    pulledAt: string | null
}

export const areaLabels: Record<AreaId, string> = {
    crm: 'Zoho CRM',
    projects: 'Zoho Projects',
}

// Placeholder until the browser command serves the real catalog.
const placeholderGroups: ArtifactGroup[] = [
    { area: 'crm', id: 'functions', label: 'Functions', count: null, pulledAt: null },
    { area: 'crm', id: 'modules', label: 'Modules', count: null, pulledAt: null },
    { area: 'crm', id: 'workflows', label: 'Workflow rules', count: null, pulledAt: null },
    { area: 'crm', id: 'workflow-actions', label: 'Workflow actions', count: null, pulledAt: null },
    { area: 'crm', id: 'webhooks', label: 'Webhooks', count: null, pulledAt: null },
    { area: 'crm', id: 'global-picklists', label: 'Global picklists', count: null, pulledAt: null },
    { area: 'crm', id: 'client-scripts', label: 'Client scripts', count: null, pulledAt: null },
    { area: 'crm', id: 'static-resources', label: 'Static resources', count: null, pulledAt: null },
    { area: 'projects', id: 'milestones', label: 'Milestones', count: null, pulledAt: null },
    { area: 'projects', id: 'task-lists', label: 'Task lists', count: null, pulledAt: null },
    { area: 'projects', id: 'tasks', label: 'Tasks', count: null, pulledAt: null },
    { area: 'projects', id: 'issues', label: 'Issues', count: null, pulledAt: null },
]

export const useCatalogStore = defineStore('catalog', () => {
    const groups = ref<ArtifactGroup[]>(placeholderGroups)

    const groupsByArea = computed(() => ({
        crm: groups.value.filter((group) => group.area === 'crm'),
        projects: groups.value.filter((group) => group.area === 'projects'),
    }))

    function findGroup(area: string, id: string): ArtifactGroup | undefined {
        return groups.value.find((group) => group.area === area && group.id === id)
    }

    return { groups, groupsByArea, findGroup }
})
