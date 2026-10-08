import type {
    AreaId,
    ArtifactGroupSummary,
    LoginState,
    ProjectInfo,
    PullOptionName,
    PullRun,
} from '@cli/commands/browser/browser.types'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { api, ApiRequestError, subscribeToServerEvents } from '@web/api/api.client'

export const areaLabels: Record<AreaId, string> = {
    crm: 'Zoho CRM',
    projects: 'Zoho Projects',
}

/**
 * Fields are browsed inside their module, and milestones and task lists are levels of the tasks
 * tree, so these groups have no entry of their own in the sidebar.
 */
const groupsHiddenFromNavigation = new Set(['fields', 'milestones', 'task-lists'])

/** Groups whose artifacts a screen shows, so its Pull offers each of them. */
export const pullGroupsByScreen: Record<string, string[]> = {
    tasks: ['milestones', 'task-lists', 'tasks'],
    modules: ['modules', 'fields'],
}

export const useProjectStore = defineStore('project', () => {
    const project = ref<ProjectInfo | null>(null)
    const groups = ref<ArtifactGroupSummary[]>([])
    const runs = ref<PullRun[]>([])
    const loadError = ref<string | null>(null)
    /** Bumped after every finished pull, so open views know to reload their files. */
    const dataVersion = ref(0)
    const pendingAreaPulls = ref<ArtifactGroupSummary[]>([])
    const loginState = ref<LoginState>({ status: 'idle' })

    const navigationGroups = computed(() => ({
        crm: groups.value.filter((group) => group.area === 'crm' && !groupsHiddenFromNavigation.has(group.id)),
        projects: groups.value.filter(
            (group) => group.area === 'projects' && !groupsHiddenFromNavigation.has(group.id)
        ),
    }))

    const currentRun = computed(() => runs.value.find((run) => run.status === 'running') ?? null)
    const latestRun = computed(() => runs.value[0] ?? null)

    async function load() {
        try {
            const [projectInfo, groupSummaries, recentRuns, currentLogin] = await Promise.all([
                api.getProject(),
                api.getGroups(),
                api.getPulls(),
                api.getLogin(),
            ])
            project.value = projectInfo
            groups.value = groupSummaries
            runs.value = recentRuns
            loginState.value = currentLogin
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

    /** Started from a finished run; a group the server refused stays first in the queue for the next one. */
    async function startNextAreaPull() {
        const next = pendingAreaPulls.value[0]

        if (!next || currentRun.value) {
            return
        }

        try {
            await startPull(next)
            pendingAreaPulls.value.shift()
        } catch (error) {
            if (!(error instanceof ApiRequestError && error.status === 409)) {
                pendingAreaPulls.value = []
                throw error
            }
        }
    }

    function upsertRun(run: PullRun) {
        const index = runs.value.findIndex(({ id }) => id === run.id)

        if (index === -1) {
            runs.value.unshift(run)
        } else if (!runs.value[index]?.finishedAt || run.finishedAt) {
            // The answer to a POST can arrive after the event that finished the same run; it must not revive it.
            runs.value[index] = run
        }
    }

    async function startLogin() {
        const previousStatus = loginState.value.status
        const state = await api.startLogin()

        // The event stream may already have moved past `starting` by the time this answer arrives.
        if (loginState.value.status === previousStatus) {
            loginState.value = state
        }
    }

    function listen() {
        return subscribeToServerEvents(async (event) => {
            if (event.type === 'login') {
                loginState.value = event.state

                if (event.state.status === 'done') {
                    project.value = await api.getProject()
                }

                return
            }

            const previousStatus = runs.value.find(({ id }) => id === event.run.id)?.status
            upsertRun(event.run)

            if (event.run.status !== 'running' && previousStatus !== event.run.status) {
                await refreshGroups()
                dataVersion.value++
                await startNextAreaPull().catch((error) => {
                    loadError.value = error instanceof Error ? error.message : String(error)
                })
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
        loginState,
        navigationGroups,
        currentRun,
        latestRun,
        load,
        listen,
        findGroup,
        startPull,
        startAreaPull,
        startLogin,
    }
})
