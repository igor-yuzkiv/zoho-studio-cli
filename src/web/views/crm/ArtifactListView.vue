<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

import { api } from '@web/api/api.client'
import AppBadge from '@web/components/AppBadge.vue'
import CodeViewer from '@web/components/CodeViewer.vue'
import DetailHeader from '@web/components/DetailHeader.vue'
import EmptyState from '@web/components/EmptyState.vue'
import JsonViewer from '@web/components/JsonViewer.vue'
import ListDetailLayout from '@web/components/ListDetailLayout.vue'
import ListRow from '@web/components/ListRow.vue'
import TabBar from '@web/components/TabBar.vue'
import { useApiData } from '@web/composables/useApiData'
import { useProjectStore } from '@web/stores/project.store'
import { bundleEntries, formatDate, joinAbsolutePath, matchesFilter, type BundleEntry } from '@web/utils/bundle.utils'
import type { CodeLanguage } from '@web/utils/highlight.utils'

type ArtifactRecord = {
    name?: string
    display_label?: string
    description?: string | null
    modified_time?: string | null
    state?: string
    pick_list_values?: { display_value: string; actual_value?: string }[]
    [key: string]: unknown
}

/** How one artifact group is read: which files are artifacts, and where their source sits. */
export type ArtifactListConfig = {
    groupId: string
    relativePath: string
    /** Files that describe one artifact each. */
    metadataSuffix: string
    /** Maps an artifact's metadata path to the source file next to it, when it has one. */
    sourcePathOf?: (entry: BundleEntry<ArtifactRecord>) => string | null
    sourceLanguage?: CodeLanguage
    /** Lists artifacts under the folder they sit in, such as the action type or the module. */
    sectionOf?: (entry: BundleEntry<ArtifactRecord>) => string
    isArtifact?: (entry: BundleEntry<ArtifactRecord>) => boolean
}

const props = defineProps<{ config: ArtifactListConfig }>()

const route = useRoute()
const projectStore = useProjectStore()
const group = computed(() => projectStore.findGroup('crm', props.config.groupId))
const filter = ref('')
const selectedPath = ref<string | null>(null)
const tab = ref<'source' | 'values' | 'json'>('json')

const { data: bundle } = useApiData(() => api.getJson(props.config.relativePath), [() => props.config.relativePath])

const entries = computed(() =>
    bundleEntries<ArtifactRecord>(bundle.value, props.config.metadataSuffix)
        .filter((entry) => props.config.isArtifact?.(entry) ?? true)
        .sort((left, right) => labelOf(left).localeCompare(labelOf(right)))
)

const sections = computed(() => {
    const visible = entries.value.filter((entry) => matchesFilter(filter.value, labelOf(entry), entry.path))
    const bySection = new Map<string, BundleEntry<ArtifactRecord>[]>()

    for (const entry of visible) {
        const section = props.config.sectionOf?.(entry) ?? ''
        bySection.set(section, [...(bySection.get(section) ?? []), entry])
    }

    return [...bySection.entries()].sort(([left], [right]) => left.localeCompare(right))
})

const selected = computed(() => entries.value.find(({ path }) => path === selectedPath.value) ?? null)
const sourcePath = computed(() => (selected.value ? (props.config.sourcePathOf?.(selected.value) ?? null) : null))

const tabs = computed(() => [
    ...(sourcePath.value ? [{ id: 'source' as const, label: 'Source' }] : []),
    ...(selected.value?.value.pick_list_values
        ? [{ id: 'values' as const, label: `Values · ${selected.value.value.pick_list_values.length}` }]
        : []),
    { id: 'json' as const, label: 'JSON' },
])

watch(
    [entries, () => route.query],
    () => {
        const requested = findRequested()

        if (requested) {
            selectedPath.value = requested.path
        } else if (!entries.value.some(({ path }) => path === selectedPath.value)) {
            selectedPath.value = entries.value[0]?.path ?? null
        }
    },
    { immediate: true }
)

watch(tabs, (available) => {
    tab.value = available[0]?.id ?? 'json'
})

const { data: source } = useApiData(
    () => (sourcePath.value ? api.getFileText(sourcePath.value) : Promise.resolve('')),
    [sourcePath]
)

function labelOf(entry: BundleEntry<ArtifactRecord>): string {
    return entry.value.name ?? entry.value.display_label ?? entry.fileName.replace(/\.(metadata\.)?json$/, '')
}

function findRequested() {
    const { path, name, type } = route.query

    if (typeof path === 'string') {
        return entries.value.find((entry) => entry.path === path || sourcePathOfEntry(entry) === path)
    }

    if (typeof name === 'string') {
        return entries.value.find(
            (entry) => labelOf(entry) === name && (typeof type !== 'string' || entry.directory.endsWith(`/${type}`))
        )
    }

    return undefined
}

function sourcePathOfEntry(entry: BundleEntry<ArtifactRecord>) {
    return props.config.sourcePathOf?.(entry) ?? null
}
</script>

<template>
    <EmptyState v-if="group && group.count === null" :title="`${group.label} were never pulled`" :group="group" />
    <ListDetailLayout
        v-else
        v-model:filter="filter"
        :filter-placeholder="`Filter ${entries.length} ${group?.label.toLowerCase() ?? ''}`"
    >
        <template #list>
            <p v-if="entries.length === 0" class="p-4 text-muted">Nothing here yet.</p>
            <template v-for="[section, sectionEntries] in sections" :key="section">
                <h2
                    v-if="section"
                    class="sticky top-[55px] border-b border-line bg-surface-2 px-3.5 py-1.5 text-[11px] font-medium tracking-wider text-faint uppercase"
                >
                    {{ section }} · {{ sectionEntries.length }}
                </h2>
                <ListRow
                    v-for="entry in sectionEntries"
                    :key="entry.path"
                    :active="entry.path === selectedPath"
                    @click="selectedPath = entry.path"
                >
                    <b class="block truncate font-medium">{{ labelOf(entry) }}</b>
                    <small class="block truncate text-xs text-faint">{{ formatDate(entry.value.modified_time) }}</small>
                </ListRow>
            </template>
        </template>
        <template #detail>
            <template v-if="selected">
                <DetailHeader
                    :title="labelOf(selected)"
                    :subtitle="config.sectionOf?.(selected)"
                    :path="joinAbsolutePath(projectStore.project?.sourcePath, sourcePath ?? selected.path)"
                >
                    <template #badges>
                        <AppBadge
                            v-if="selected.value.state"
                            :tone="selected.value.state === 'active' ? 'ok' : 'neutral'"
                        >
                            {{ selected.value.state }}
                        </AppBadge>
                        <AppBadge v-if="selected.value.modified_time">
                            modified {{ formatDate(selected.value.modified_time) }}
                        </AppBadge>
                    </template>
                </DetailHeader>
                <p v-if="selected.value.description" class="border-b border-line px-6 py-3 text-muted">
                    {{ selected.value.description }}
                </p>
                <TabBar v-model="tab" :tabs="tabs" />
                <CodeViewer
                    v-if="tab === 'source'"
                    :source="source ?? ''"
                    :language="config.sourceLanguage ?? 'text'"
                />
                <ul v-else-if="tab === 'values'" class="divide-y divide-line px-6 py-2">
                    <li
                        v-for="(value, index) in selected.value.pick_list_values ?? []"
                        :key="index"
                        class="flex gap-3 py-1.5 text-[13px]"
                    >
                        {{ value.display_value }}
                        <span
                            v-if="value.actual_value && value.actual_value !== value.display_value"
                            class="ml-auto font-mono text-xs text-faint"
                        >
                            {{ value.actual_value }}
                        </span>
                    </li>
                </ul>
                <JsonViewer v-else :value="selected.value" />
            </template>
            <EmptyState v-else title="Nothing selected" />
        </template>
    </ListDetailLayout>
</template>
