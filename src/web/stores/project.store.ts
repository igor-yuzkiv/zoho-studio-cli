import type {
    AreaId,
    ArtifactGroupSummary,
    ProjectInfo,
    PullOptionName,
    PullRun,
} from '@cli/commands/browser/browser.types'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { api, subscribeToServerEvents } from '@web/api/api.client'

export const areaLabels: Record<AreaId, string> = {
    crm: 'Zoho CRM',
    projects: 'Zoho Projects',
}

/** Fields are browsed inside their module, so they have no entry of their own in the sidebar. */
const groupsHiddenFromNavigation = new Set(['fields'])

export const useProjectStore = defineStore('project', () => {
    const project = ref<ProjectInfo | null>(null)
    const groups = ref<ArtifactGroupSummary[]>([])
    const runs = ref<PullRun[]>([])
    const loadError = ref<string | null>(null)
    /** Bumped after every finished pull, so open views know to reload their files. */
    const dataVersion = ref(0)
    const pendingAreaPulls = ref<ArtifactGroupSummary[]>([])

    const navigationGroups = computed(() => ({
        crm: groups.value.filter((group) => group.area === 'crm' && !groupsHiddenFromNavigation.has(group.id)),
        projects: groups.value.filter((group) => group.area === 'projects'),
    }))

    const currentRun = computed(() => runs.value.find((run) => run.status === 'running') ?? null)
    const latestRun = computed(() => runs.value[0] ?? null)

    async function load() {
        try {
            const [projectInfo, groupSummaries, recentRuns] = await Promise.all([
                api.getProject(),
                api.getGroups(),
                api.getPulls(),
            ])
            project.value = projectInfo
            groups.value = groupSummaries
            runs.value = recentRuns
            loadError.value = null
        } catch (error) {
            loadError.value = error instanceof Error ? error.message : String(error)
        }
    }

    async function refreshGroups() {
        groups.value = await api.getGroups()
    }

    function findGroup(area: string, id: string): ArtifactGroupSummary | undefined {
        return groups.value.find((group) => group.area === area && group.id === id)
    }

    async function startPull(group: ArtifactGroupSummary, options: Partial<Record<PullOptionName, string>> = {}) {
        const run = await api.startPull({ area: group.area, group: group.id, options })
        upsertRun(run)

        return run
    }

    /** The server runs one pull at a time, so a whole area is queued here and started run by run. */
    async function startAreaPull(area: AreaId) {
        pendingAreaPulls.value = groups.value.filter((group) => group.area === area)
        await startNextAreaPull()
    }

    async function startNextAreaPull() {
        const next = pendingAreaPulls.value.shift()

        if (next) {
            await startPull(next)
        }
    }

    function upsertRun(run: PullRun) {
        const index = runs.value.findIndex(({ id }) => id === run.id)

        if (index === -1) {
            runs.value.unshift(run)
        } else {
            runs.value[index] = run
        }
    }

    function listen() {
        return subscribeToServerEvents(async (event) => {
            if (event.type !== 'pull') {
                return
            }

            const previousStatus = runs.value.find(({ id }) => id === event.run.id)?.status
            upsertRun(event.run)

            if (event.run.status !== 'running' && previousStatus !== event.run.status) {
                await refreshGroups()
                dataVersion.value++
                await startNextAreaPull()
            }
        })
    }

    return {
        project,
        groups,
        runs,
        loadError,
        dataVersion,
        pendingAreaPulls,
        navigationGroups,
        currentRun,
        latestRun,
        load,
        listen,
        findGroup,
        startPull,
        startAreaPull,
    }
})
