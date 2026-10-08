<script setup lang="ts">
import type { AreaId, ArtifactGroupSummary } from '@cli/commands/browser/browser.types'
import { computed } from 'vue'
import { useRouter } from 'vue-router'

import AppBadge from '@web/components/AppBadge.vue'
import AppButton from '@web/components/AppButton.vue'
import CopyPathButton from '@web/components/CopyPathButton.vue'
import { areaLabels, useProjectStore } from '@web/stores/project.store'
import { useUiStore } from '@web/stores/ui.store'
import { formatCount, formatTimeAgo } from '@web/utils/time.utils'

const projectStore = useProjectStore()
const ui = useUiStore()
const router = useRouter()

const areas: AreaId[] = ['crm', 'projects']

const organization = computed(() => projectStore.project?.organization ?? null)
const organizationName = computed(() => String(organization.value?.company_name ?? projectStore.project?.name ?? ''))
const totalArtifacts = computed(() => projectStore.groups.reduce((sum, group) => sum + (group.count ?? 0), 0))

const organizationFacts = computed(() => {
    const facts: { label: string; value: string }[] = [{ label: 'Artifacts', value: formatCount(totalArtifacts.value) }]

    if (organization.value?.type) {
        facts.unshift({ label: 'Org type', value: String(organization.value.type) })
    }

    if (organization.value?.time_zone) {
        facts.push({ label: 'Time zone', value: String(organization.value.time_zone) })
    }

    return facts
})

function openGroup(group: ArtifactGroupSummary) {
    // Fields are browsed inside their module.
    const id = group.id === 'fields' ? 'modules' : group.id
    void router.push({ name: 'group', params: { area: group.area, group: id } })
}

function groupsOf(area: AreaId) {
    return projectStore.groups.filter((group) => group.area === area)
}
</script>

<template>
    <section class="px-7 py-6">
        <div class="mb-6 flex flex-wrap items-end justify-between gap-6">
            <div class="min-w-0">
                <h1 class="text-[22px] font-semibold tracking-tight">{{ organizationName }}</h1>
                <div class="mt-0.5 flex flex-wrap items-center gap-2 text-muted">
                    <span v-if="organization?.id">CRM org {{ organization.id }} ·</span>
                    <span class="font-mono text-xs">{{ projectStore.project?.sourcePath }}</span>
                    <CopyPathButton v-if="projectStore.project" :path="projectStore.project.sourcePath" />
                </div>
            </div>
            <dl class="flex gap-7 text-[13px] text-muted">
                <div v-for="fact in organizationFacts" :key="fact.label">
                    <dt>{{ fact.label }}</dt>
                    <dd class="font-medium text-fg">{{ fact.value }}</dd>
                </div>
            </dl>
        </div>

        <template v-for="area in areas" :key="area">
            <div class="mt-6 mb-2.5 flex items-center gap-2 font-semibold">
                <span class="size-1.5 rounded-full" :class="area === 'crm' ? 'bg-crm' : 'bg-projects'" />
                {{ areaLabels[area] }}
                <AppButton
                    size="sm"
                    class="ml-auto"
                    :disabled="!!projectStore.currentRun"
                    @click="projectStore.startAreaPull(area).then(() => (ui.pullPanelOpen = true))"
                >
                    ↓ Pull all {{ area === 'crm' ? 'CRM' : 'Projects' }}
                </AppButton>
            </div>
            <div
                class="grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] overflow-hidden rounded-[10px] border border-line bg-surface"
            >
                <div
                    v-for="group in groupsOf(area)"
                    :key="group.id"
                    role="link"
                    tabindex="0"
                    class="-mr-px -mb-px flex cursor-pointer flex-col gap-2.5 border-r border-b border-line bg-surface px-4 py-3.5 transition-colors hover:bg-surface-2"
                    @click="openGroup(group)"
                    @keydown.enter="openGroup(group)"
                >
                    <div class="flex items-center justify-between text-[13px] text-muted">
                        {{ group.label }}
                        <AppBadge v-if="group.count === null" tone="warn">not pulled</AppBadge>
                    </div>
                    <div class="text-[26px] leading-none font-semibold tracking-tight">
                        {{ formatCount(group.count) }}
                    </div>
                    <div class="flex items-center justify-between text-xs text-faint">
                        <span>{{ formatTimeAgo(group.pulledAt) }}</span>
                        <button
                            type="button"
                            class="rounded-md border border-line px-2 py-0.5 text-xs text-muted transition-colors hover:border-accent hover:text-accent"
                            :aria-label="`Pull ${group.label}`"
                            @click.stop="ui.openPullDialog(group)"
                        >
                            ↓ Pull
                        </button>
                    </div>
                </div>
            </div>
        </template>

        <template v-if="projectStore.runs.length">
            <div class="mt-6 mb-2.5 font-semibold">Recent pulls</div>
            <div class="divide-y divide-line rounded-[10px] border border-line bg-surface">
                <div
                    v-for="run in projectStore.runs.slice(0, 8)"
                    :key="run.id"
                    class="flex items-center gap-3 px-4 py-2.5 text-[13px]"
                >
                    <AppBadge
                        :tone="
                            run.status === 'done'
                                ? 'ok'
                                : run.status === 'partial'
                                  ? 'warn'
                                  : run.status === 'failed'
                                    ? 'err'
                                    : 'neutral'
                        "
                    >
                        {{ run.status }}
                    </AppBadge>
                    <span class="truncate font-mono text-xs">{{ run.command }}</span>
                    <time class="ml-auto shrink-0 text-xs text-faint">{{
                        formatTimeAgo(run.finishedAt ?? run.startedAt)
                    }}</time>
                </div>
            </div>
        </template>
    </section>
</template>
