<script setup lang="ts">
import type { FileEntry } from '@cli/commands/browser/browser.types'
import { Box } from '@lucide/vue'
import { computed, reactive, ref, watch } from 'vue'

import { api } from '@web/api/api.client'
import AppBadge from '@web/components/AppBadge.vue'
import AppButton from '@web/components/AppButton.vue'
import CopyPathButton from '@web/components/CopyPathButton.vue'
import EmptyState from '@web/components/EmptyState.vue'
import JsonDialog from '@web/components/JsonDialog.vue'
import JsonViewer from '@web/components/JsonViewer.vue'
import ListDetailLayout from '@web/components/ListDetailLayout.vue'
import ExplorerItem from '@web/components/ExplorerItem.vue'
import TabBar from '@web/components/TabBar.vue'
import { useApiData } from '@web/composables/useApiData'
import { useProjectStore } from '@web/stores/project.store'
import { useUiStore } from '@web/stores/ui.store'
import { bundleEntries, formatDate, matchesFilter } from '@web/utils/bundle.utils'
import { formatTimeAgo } from '@web/utils/time.utils'

import type { FieldMetadata, ModuleMetadata, WorkflowRule } from './crm.types'
import WorkflowDetail from './WorkflowDetail.vue'

type FieldColumn = 'field_label' | 'api_name' | 'data_type'

const projectStore = useProjectStore()
const ui = useUiStore()
const modulesGroup = computed(() => projectStore.findGroup('crm', 'modules'))
const fieldsGroup = computed(() => projectStore.findGroup('crm', 'fields'))

const moduleFilter = ref('')
const fieldFilter = ref('')
const selectedModule = ref<string | null>(null)
const tab = ref<'fields' | 'settings' | 'workflows' | 'client-scripts'>('fields')
const sortColumn = ref<FieldColumn>('field_label')
const sortDescending = ref(false)
const rawField = ref<FieldMetadata | null>(null)
const expandedWorkflows = reactive(new Set<string>())

function toggleWorkflow(path: string) {
    if (expandedWorkflows.has(path)) {
        expandedWorkflows.delete(path)
    } else {
        expandedWorkflows.add(path)
    }
}

const { data: modulesTree } = useApiData(() => api.getTree('zoho-crm/modules', 3))
const { data: workflowsBundle } = useApiData(() => api.getJson('zoho-crm/workflows').catch(() => ({})))
const { data: clientScriptsTree } = useApiData(() => api.getTree('zoho-crm/client-scripts', 4).catch(() => null))

const modules = computed(() =>
    (modulesTree.value?.children ?? [])
        .filter((entry) => entry.kind === 'directory')
        .map((entry) => ({
            name: entry.name,
            entry,
            fieldCount: entry.children?.find((child) => child.name === 'fields')?.children?.length ?? 0,
        }))
)
const visibleModules = computed(() => modules.value.filter(({ name }) => matchesFilter(moduleFilter.value, name)))
const currentModule = computed(() => modules.value.find(({ name }) => name === selectedModule.value) ?? null)

watch(modules, (list) => {
    if (!list.some(({ name }) => name === selectedModule.value)) {
        selectedModule.value = list.find(({ name }) => name === 'Leads')?.name ?? list[0]?.name ?? null
    }
})

const { data: moduleBundle } = useApiData(
    () => (selectedModule.value ? api.getJson(`zoho-crm/modules/${selectedModule.value}`) : Promise.resolve({})),
    [selectedModule]
)

const metadata = computed(() => bundleEntries<ModuleMetadata>(moduleBundle.value, '.metadata.json')[0]?.value ?? null)
const fields = computed(() =>
    bundleEntries<FieldMetadata>(moduleBundle.value)
        .filter(({ directory }) => directory.endsWith('/fields'))
        .map(({ value }) => value)
)
const visibleFields = computed(() => {
    const direction = sortDescending.value ? -1 : 1

    return fields.value
        .filter((field) => matchesFilter(fieldFilter.value, field.field_label, field.api_name, field.data_type))
        .sort(
            (left, right) => direction * String(left[sortColumn.value]).localeCompare(String(right[sortColumn.value]))
        )
})

const moduleWorkflows = computed(() =>
    bundleEntries<WorkflowRule>(workflowsBundle.value).filter(
        ({ value }) => value.module?.api_name === selectedModule.value
    )
)
const moduleClientScripts = computed(() =>
    collectScripts(clientScriptsTree.value?.children?.find(({ name }) => name === selectedModule.value))
)

function collectScripts(entry: FileEntry | undefined): FileEntry[] {
    if (!entry) {
        return []
    }

    return entry.kind === 'file'
        ? entry.name.endsWith('.js')
            ? [entry]
            : []
        : (entry.children ?? []).flatMap(collectScripts)
}

function sortBy(column: FieldColumn) {
    sortDescending.value = sortColumn.value === column ? !sortDescending.value : false
    sortColumn.value = column
}

function describeRelation(field: FieldMetadata): string {
    if (field.lookup?.module?.api_name) {
        return `→ ${field.lookup.module.api_name}`
    }

    if (field.pick_list_values?.length) {
        return `${field.pick_list_values.length} values`
    }

    return field.formula?.return_type ? `formula: ${field.formula.return_type}` : ''
}

function pullModuleFields() {
    if (fieldsGroup.value && selectedModule.value) {
        ui.openPullDialog(fieldsGroup.value, { module: selectedModule.value })
    }
}

const columns: { id: FieldColumn; label: string }[] = [
    { id: 'field_label', label: 'Label' },
    { id: 'api_name', label: 'API name' },
    { id: 'data_type', label: 'Type' },
]
</script>

<template>
    <EmptyState
        v-if="modulesGroup && modulesGroup.count === null"
        title="Modules were never pulled"
        message="Pull the modules first, then their fields."
        :group="modulesGroup"
    />
    <ListDetailLayout v-else v-model:filter="moduleFilter" list-width="260px" :item-count="visibleModules.length">
        <template #list>
            <ExplorerItem
                v-for="module in visibleModules"
                :key="module.name"
                :label="module.name"
                :icon="Box"
                :meta="String(module.fieldCount)"
                :indent="-1"
                :active="module.name === selectedModule"
                @click="selectedModule = module.name"
            />
        </template>
        <template #detail>
            <div v-if="currentModule" class="px-7 py-6">
                <div class="flex flex-wrap items-end gap-3">
                    <div class="min-w-0 flex-1">
                        <h1 class="text-[22px] font-semibold tracking-tight">
                            {{ metadata?.plural_label ?? currentModule.name }}
                        </h1>
                        <div class="mt-0.5 flex flex-wrap items-center gap-2 text-muted">
                            <span class="font-mono text-xs">{{ currentModule.name }}</span>
                            · {{ fields.length }} fields · pulled {{ formatTimeAgo(currentModule.entry.modifiedAt) }}
                            <AppBadge v-if="metadata?.generated_type === 'custom'" tone="accent">custom</AppBadge>
                        </div>
                    </div>
                    <CopyPathButton :path="currentModule.entry.absolutePath" />
                    <AppButton size="sm" @click="pullModuleFields">↓ Pull this module</AppButton>
                </div>

                <TabBar
                    v-model="tab"
                    class="mt-3.5 !bg-transparent !px-0"
                    :tabs="[
                        { id: 'fields', label: `Fields · ${fields.length}` },
                        { id: 'settings', label: 'Module settings' },
                        { id: 'workflows', label: `Workflows · ${moduleWorkflows.length}` },
                        { id: 'client-scripts', label: `Client scripts · ${moduleClientScripts.length}` },
                    ]"
                />

                <template v-if="tab === 'fields'">
                    <input
                        v-model="fieldFilter"
                        class="mt-4 h-[30px] w-64 rounded-md border border-line bg-surface px-2.5 text-[13px]"
                        placeholder="Filter by label, API name or type"
                        aria-label="Filter fields"
                    />
                    <EmptyState
                        v-if="fields.length === 0"
                        title="No fields pulled for this module"
                        message="Pull this module's fields to see them here."
                    />
                    <div v-else class="mt-3 overflow-hidden rounded-[10px] border border-line bg-surface">
                        <table class="w-full text-[13px]">
                            <thead>
                                <tr>
                                    <th
                                        v-for="column in columns"
                                        :key="column.id"
                                        class="cursor-pointer border-b border-line bg-surface-2 px-3.5 py-2 text-left font-medium whitespace-nowrap text-faint select-none"
                                        :aria-sort="
                                            sortColumn === column.id
                                                ? sortDescending
                                                    ? 'descending'
                                                    : 'ascending'
                                                : 'none'
                                        "
                                        @click="sortBy(column.id)"
                                    >
                                        {{ column.label }}
                                        <span v-if="sortColumn === column.id">{{ sortDescending ? '↓' : '↑' }}</span>
                                    </th>
                                    <th
                                        class="border-b border-line bg-surface-2 px-3.5 py-2 text-left font-medium text-faint"
                                    >
                                        Required
                                    </th>
                                    <th
                                        class="border-b border-line bg-surface-2 px-3.5 py-2 text-left font-medium text-faint"
                                    >
                                        Custom
                                    </th>
                                    <th
                                        class="border-b border-line bg-surface-2 px-3.5 py-2 text-left font-medium text-faint"
                                    >
                                        Lookup / picklist
                                    </th>
                                    <th class="border-b border-line bg-surface-2 px-3.5 py-2">
                                        <span class="sr-only">Raw JSON</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr
                                    v-for="field in visibleFields"
                                    :key="field.api_name"
                                    class="border-b border-line last:border-0 hover:bg-hover"
                                >
                                    <td class="px-3.5 py-2 whitespace-nowrap">{{ field.field_label }}</td>
                                    <td class="px-3.5 py-2 font-mono text-xs">{{ field.api_name }}</td>
                                    <td class="px-3.5 py-2">
                                        <AppBadge>{{ field.data_type }}</AppBadge>
                                    </td>
                                    <td class="px-3.5 py-2">{{ field.system_mandatory ? '✓' : '' }}</td>
                                    <td class="px-3.5 py-2">
                                        <AppBadge v-if="field.custom_field" tone="accent">custom</AppBadge>
                                    </td>
                                    <td class="px-3.5 py-2 whitespace-nowrap text-muted">
                                        {{ describeRelation(field) }}
                                    </td>
                                    <td class="px-2 py-1 text-right">
                                        <button
                                            type="button"
                                            class="rounded-md border border-line px-2 py-0.5 font-mono text-xs whitespace-nowrap text-muted transition-colors hover:border-accent hover:text-accent"
                                            :aria-label="`Raw JSON of ${field.api_name}`"
                                            @click="rawField = field"
                                        >
                                            { }
                                        </button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </template>

                <JsonViewer v-else-if="tab === 'settings'" :value="metadata" class="!mx-0" />

                <div v-else-if="tab === 'workflows'" class="mt-3 flex flex-col gap-4">
                    <p v-if="!moduleWorkflows.length" class="text-muted">No workflow rules for this module.</p>
                    <div
                        v-for="workflow in moduleWorkflows"
                        :key="workflow.path"
                        class="overflow-hidden rounded-[10px] border border-line bg-surface"
                    >
                        <button
                            type="button"
                            class="flex w-full items-center gap-2 px-4 py-2.5 text-left font-medium hover:bg-hover"
                            :aria-expanded="expandedWorkflows.has(workflow.path)"
                            @click="toggleWorkflow(workflow.path)"
                        >
                            <span
                                class="w-3.5 text-faint transition-transform"
                                :class="expandedWorkflows.has(workflow.path) && 'rotate-90'"
                                >›</span
                            >
                            {{ workflow.value.name }}
                            <span class="text-xs font-normal text-faint">
                                {{ workflow.value.execute_when?.type?.replace(/_/g, ' ') }}
                            </span>
                            <AppBadge :tone="workflow.value.status?.active ? 'ok' : 'neutral'" class="ml-auto">
                                {{ workflow.value.status?.active ? 'active' : 'inactive' }}
                            </AppBadge>
                        </button>
                        <WorkflowDetail
                            v-if="expandedWorkflows.has(workflow.path)"
                            class="border-t border-line"
                            :workflow="workflow.value"
                        />
                    </div>
                </div>

                <div v-else class="mt-3 flex flex-col gap-2">
                    <p v-if="!moduleClientScripts.length" class="text-muted">No client scripts for this module.</p>
                    <RouterLink
                        v-for="script in moduleClientScripts"
                        :key="script.path"
                        :to="{
                            name: 'group',
                            params: { area: 'crm', group: 'client-scripts' },
                            query: { path: script.path },
                        }"
                        class="flex items-center gap-3 rounded-lg border border-line bg-surface px-4 py-2.5 hover:bg-hover"
                    >
                        <span class="font-mono text-[13px]">{{ script.name }}</span>
                        <span class="ml-auto truncate text-xs text-faint">{{ script.path }}</span>
                    </RouterLink>
                </div>
                <p class="mt-4 text-xs text-faint">Module modified {{ formatDate(metadata?.modified_time) }}</p>
            </div>
            <EmptyState v-else title="No module selected" />
        </template>
    </ListDetailLayout>
    <JsonDialog
        :value="rawField"
        :title="rawField ? `${rawField.field_label} · ${rawField.api_name}` : ''"
        @close="rawField = null"
    />
</template>
