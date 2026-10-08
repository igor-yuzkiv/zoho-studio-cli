<script setup lang="ts">
import { Workflow } from '@lucide/vue'
import { computed, ref, watch } from 'vue'

import { api } from '@web/api/api.client'
import AppBadge from '@web/components/AppBadge.vue'
import DetailHeader from '@web/components/DetailHeader.vue'
import EmptyState from '@web/components/EmptyState.vue'
import JsonViewer from '@web/components/JsonViewer.vue'
import ListDetailLayout from '@web/components/ListDetailLayout.vue'
import ExplorerItem from '@web/components/ExplorerItem.vue'
import ExplorerSection from '@web/components/ExplorerSection.vue'
import TabBar from '@web/components/TabBar.vue'
import { useApiData } from '@web/composables/useApiData'
import { useProjectStore } from '@web/stores/project.store'
import { bundleEntries, formatDate, joinAbsolutePath, matchesFilter } from '@web/utils/bundle.utils'

import type { WorkflowRule } from './crm.types'
import WorkflowDetail from './WorkflowDetail.vue'

const projectStore = useProjectStore()
const group = computed(() => projectStore.findGroup('crm', 'workflows'))
const filter = ref('')
const selectedPath = ref<string | null>(null)
const tab = ref<'flow' | 'json'>('flow')

const { data: bundle } = useApiData(() => api.getJson('zoho-crm/workflows'))

const workflows = computed(() =>
    bundleEntries<WorkflowRule>(bundle.value).sort((left, right) => left.value.name.localeCompare(right.value.name))
)
const sections = computed(() => {
    const byModule = new Map<string, typeof workflows.value>()

    for (const entry of workflows.value) {
        if (matchesFilter(filter.value, entry.value.name, entry.value.module?.api_name)) {
            const moduleName = entry.value.module?.api_name ?? '—'
            byModule.set(moduleName, [...(byModule.get(moduleName) ?? []), entry])
        }
    }

    return [...byModule.entries()].sort(([left], [right]) => left.localeCompare(right))
})
const visibleCount = computed(() => sections.value.reduce((sum, [, entries]) => sum + entries.length, 0))
const selected = computed(() => workflows.value.find(({ path }) => path === selectedPath.value) ?? null)

watch(workflows, (entries) => {
    if (!entries.some(({ path }) => path === selectedPath.value)) {
        selectedPath.value = entries[0]?.path ?? null
    }
})
</script>

<template>
    <EmptyState v-if="group && group.count === null" title="Workflow rules were never pulled" :group="group" />
    <ListDetailLayout v-else v-model:filter="filter" :item-count="visibleCount">
        <template #list>
            <ExplorerSection
                v-for="[moduleName, entries] in sections"
                :key="moduleName"
                :title="moduleName"
                :count="entries.length"
            >
                <ExplorerItem
                    v-for="entry in entries"
                    :key="entry.path"
                    :label="entry.value.name"
                    :icon="Workflow"
                    :meta="entry.value.status?.active ? undefined : 'off'"
                    :active="entry.path === selectedPath"
                    @click="selectedPath = entry.path"
                />
            </ExplorerSection>
        </template>
        <template #detail>
            <template v-if="selected">
                <DetailHeader
                    :title="selected.value.name"
                    :path="joinAbsolutePath(projectStore.project?.sourcePath, selected.path)"
                >
                    <template #badges>
                        <AppBadge :tone="selected.value.status?.active ? 'ok' : 'neutral'">
                            ● {{ selected.value.status?.active ? 'active' : 'inactive' }}
                        </AppBadge>
                        <AppBadge v-if="selected.value.module?.api_name">{{ selected.value.module.api_name }}</AppBadge>
                        <AppBadge>modified {{ formatDate(selected.value.modified_time) }}</AppBadge>
                    </template>
                </DetailHeader>
                <p v-if="selected.value.description" class="border-b border-line bg-surface px-6 py-3 text-muted">
                    {{ selected.value.description }}
                </p>
                <TabBar
                    v-model="tab"
                    :tabs="[
                        { id: 'flow', label: 'Flow' },
                        { id: 'json', label: 'JSON' },
                    ]"
                />
                <WorkflowDetail v-if="tab === 'flow'" :workflow="selected.value" />
                <JsonViewer v-else :value="selected.value" />
            </template>
            <EmptyState v-else title="No workflow rules" />
        </template>
    </ListDetailLayout>
</template>
