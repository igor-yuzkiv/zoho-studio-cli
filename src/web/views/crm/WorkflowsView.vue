<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import { api } from '@web/api/api.client'
import AppBadge from '@web/components/AppBadge.vue'
import DetailHeader from '@web/components/DetailHeader.vue'
import EmptyState from '@web/components/EmptyState.vue'
import JsonViewer from '@web/components/JsonViewer.vue'
import ListDetailLayout from '@web/components/ListDetailLayout.vue'
import ListRow from '@web/components/ListRow.vue'
import TabBar from '@web/components/TabBar.vue'
import { useApiData } from '@web/composables/useApiData'
import { useProjectStore } from '@web/stores/project.store'
import { bundleEntries, formatDate, joinAbsolutePath, matchesFilter } from '@web/utils/bundle.utils'

import type { WorkflowRule } from './crm.types'
import WorkflowDetail from './WorkflowDetail.vue'

const projectStore = useProjectStore()
const group = computed(() => projectStore.findGroup('crm', 'workflows'))
const filter = ref('')
const moduleFilter = ref<string | null>(null)
const selectedPath = ref<string | null>(null)
const tab = ref<'flow' | 'json'>('flow')

const { data: bundle } = useApiData(() => api.getJson('zoho-crm/workflows'))

const workflows = computed(() =>
    bundleEntries<WorkflowRule>(bundle.value).sort((left, right) => left.value.name.localeCompare(right.value.name))
)
const moduleNames = computed(() =>
    [...new Set(workflows.value.map(({ value }) => value.module?.api_name ?? '—'))].sort()
)
const visibleWorkflows = computed(() =>
    workflows.value.filter(
        ({ value }) =>
            matchesFilter(filter.value, value.name) &&
            (!moduleFilter.value || value.module?.api_name === moduleFilter.value)
    )
)
const selected = computed(() => workflows.value.find(({ path }) => path === selectedPath.value) ?? null)

watch(workflows, (entries) => {
    if (!entries.some(({ path }) => path === selectedPath.value)) {
        selectedPath.value = entries[0]?.path ?? null
    }
})
</script>

<template>
    <EmptyState v-if="group && group.count === null" title="Workflow rules were never pulled" :group="group" />
    <ListDetailLayout v-else v-model:filter="filter" :filter-placeholder="`Filter ${workflows.length} rules`">
        <template #list-tools>
            <select
                v-model="moduleFilter"
                class="h-[30px] w-28 rounded-md border border-line bg-surface px-1.5 text-xs"
                aria-label="Module"
            >
                <option :value="null">All modules</option>
                <option v-for="name in moduleNames" :key="name" :value="name">{{ name }}</option>
            </select>
        </template>
        <template #list>
            <ListRow
                v-for="entry in visibleWorkflows"
                :key="entry.path"
                :active="entry.path === selectedPath"
                @click="selectedPath = entry.path"
            >
                <b class="block truncate font-medium">{{ entry.value.name }}</b>
                <small class="text-xs text-faint">
                    {{ entry.value.module?.api_name }} ·
                    <span :class="entry.value.status?.active && 'text-ok'">
                        {{ entry.value.status?.active ? 'active' : 'inactive' }}
                    </span>
                </small>
            </ListRow>
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
                <p v-if="selected.value.description" class="border-b border-line px-6 py-3 text-muted">
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
