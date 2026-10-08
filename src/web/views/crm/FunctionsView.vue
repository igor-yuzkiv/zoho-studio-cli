<script setup lang="ts">
import { SquareFunction } from '@lucide/vue'
import { computed, ref, watch } from 'vue'

import { api } from '@web/api/api.client'
import AppBadge from '@web/components/AppBadge.vue'
import CodeViewer from '@web/components/CodeViewer.vue'
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

type FunctionMetadata = {
    id: string
    name: string
    api_name: string
    category?: string
    language?: string
    state?: string
    description?: string | null
    modified_time?: string
    modified_by?: { name?: string } | null
    arguments?: { name: string; type: string }[]
}

const projectStore = useProjectStore()
const group = computed(() => projectStore.findGroup('crm', 'functions'))
const filter = ref('')
const selectedPath = ref<string | null>(null)
const tab = ref<'code' | 'arguments' | 'metadata'>('code')

const { data: bundle } = useApiData(() => api.getJson('zoho-crm/functions'))

const functions = computed(() =>
    bundleEntries<FunctionMetadata>(bundle.value, '.metadata.json').sort((left, right) =>
        left.value.name.localeCompare(right.value.name)
    )
)
const sections = computed(() => {
    const byCategory = new Map<string, typeof functions.value>()

    for (const entry of functions.value) {
        if (matchesFilter(filter.value, entry.value.name, entry.value.api_name)) {
            const category = entry.value.category ?? 'other'
            byCategory.set(category, [...(byCategory.get(category) ?? []), entry])
        }
    }

    return [...byCategory.entries()].sort(([left], [right]) => left.localeCompare(right))
})
const visibleCount = computed(() => sections.value.reduce((sum, [, entries]) => sum + entries.length, 0))
const selected = computed(() => functions.value.find(({ path }) => path === selectedPath.value) ?? null)
const codePath = computed(() => selected.value?.path.replace(/\.metadata\.json$/, '.deluge') ?? null)

watch(functions, (entries) => {
    if (!entries.some(({ path }) => path === selectedPath.value)) {
        selectedPath.value = entries[0]?.path ?? null
    }
})

const { data: code } = useApiData(
    () => (codePath.value ? api.getFileText(codePath.value) : Promise.resolve('')),
    [codePath]
)
</script>

<template>
    <EmptyState
        v-if="group && group.count === null"
        title="Functions were never pulled"
        message="Pull them to browse their code here."
        :group="group"
    />
    <ListDetailLayout v-else v-model:filter="filter" :item-count="visibleCount">
        <template #list>
            <ExplorerSection
                v-for="[category, entries] in sections"
                :key="category"
                :title="category"
                :count="entries.length"
            >
                <ExplorerItem
                    v-for="entry in entries"
                    :key="entry.path"
                    :label="entry.value.name"
                    :icon="SquareFunction"
                    :active="entry.path === selectedPath"
                    @click="selectedPath = entry.path"
                />
            </ExplorerSection>
        </template>
        <template #detail>
            <template v-if="selected">
                <DetailHeader
                    :title="selected.value.name"
                    :subtitle="selected.value.api_name"
                    :path="joinAbsolutePath(projectStore.project?.sourcePath, selected.directory)"
                    mono
                >
                    <template #badges>
                        <AppBadge v-if="selected.value.category">{{ selected.value.category }}</AppBadge>
                        <AppBadge :tone="selected.value.state === 'active' ? 'ok' : 'neutral'">
                            {{ selected.value.state ?? 'unknown' }}
                        </AppBadge>
                        <AppBadge>
                            modified {{ formatDate(selected.value.modified_time) }}
                            <template v-if="selected.value.modified_by?.name">
                                by {{ selected.value.modified_by.name }}</template
                            >
                        </AppBadge>
                    </template>
                </DetailHeader>
                <p v-if="selected.value.description" class="border-b border-line bg-surface px-6 py-3 text-muted">
                    {{ selected.value.description }}
                </p>
                <TabBar
                    v-model="tab"
                    :tabs="[
                        { id: 'code', label: 'Code' },
                        { id: 'arguments', label: `Arguments · ${selected.value.arguments?.length ?? 0}` },
                        { id: 'metadata', label: 'Metadata JSON' },
                    ]"
                />
                <CodeViewer v-if="tab === 'code'" :source="code ?? ''" language="deluge" />
                <div v-else-if="tab === 'arguments'" class="m-4 rounded-[10px] border border-line bg-surface px-4 py-3">
                    <p v-if="!selected.value.arguments?.length" class="text-muted">No arguments.</p>
                    <table v-else class="w-full text-[13px]">
                        <thead>
                            <tr class="text-left text-faint">
                                <th class="py-1.5 font-medium">Name</th>
                                <th class="py-1.5 font-medium">Type</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr
                                v-for="argument in selected.value.arguments"
                                :key="argument.name"
                                class="border-t border-line"
                            >
                                <td class="py-1.5 font-mono">{{ argument.name }}</td>
                                <td class="py-1.5 text-muted">{{ argument.type }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <JsonViewer v-else :value="selected.value" />
            </template>
            <EmptyState v-else title="No function selected" />
        </template>
    </ListDetailLayout>
</template>
