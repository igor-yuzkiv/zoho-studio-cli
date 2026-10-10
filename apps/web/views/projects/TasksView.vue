<script setup lang="ts">
import { ChevronRight, Flag, ListTodo } from '@lucide/vue'
import { computed, reactive, ref, watch } from 'vue'

import { api } from '@web/api/api.client'
import EmptyState from '@web/components/EmptyState.vue'
import ExplorerItem from '@web/components/ExplorerItem.vue'
import ListDetailLayout from '@web/components/ListDetailLayout.vue'
import { useApiData } from '@web/composables/useApiData'
import { useProjectStore } from '@web/stores/project.store'
import { formatDate, matchesFilter } from '@web/utils/bundle.utils'

import RecordDetail from './RecordDetail.vue'
import { buildTaskTree, isClosed, loadRecords, personName, type LoadedRecord } from './projects.utils'

const projectStore = useProjectStore()
const milestonesGroup = computed(() => projectStore.findGroup('projects', 'milestones'))
const filter = ref('')
const onlyOpen = ref(true)
const selectedPath = ref<string | null>(null)
const collapsed = reactive(new Set<string>())

const { data: bundle } = useApiData(() => api.getJson('zoho-projects/raw').catch(() => ({})))

const records = computed(() => loadRecords(bundle.value))
const tree = computed(() => buildTaskTree(records.value))

const visibleTree = computed(() =>
    tree.value
        .map((milestone) => ({
            ...milestone,
            taskLists: milestone.taskLists
                .map((taskList) => ({
                    ...taskList,
                    tasks: taskList.tasks.filter(
                        ({ record }) =>
                            (!onlyOpen.value || !isClosed(record)) &&
                            matchesFilter(filter.value, record.name, record.prefix)
                    ),
                }))
                .filter((taskList) => taskList.tasks.length > 0 || !filter.value),
        }))
        .filter((milestone) => milestone.taskLists.length > 0 || !filter.value)
)

const visibleTaskCount = computed(() =>
    visibleTree.value.reduce(
        (sum, milestone) => sum + milestone.taskLists.reduce((listSum, taskList) => listSum + taskList.tasks.length, 0),
        0
    )
)
const selected = computed(() => records.value.find(({ path }) => path === selectedPath.value) ?? null)

watch(tree, (milestones) => {
    if (!selected.value) {
        selectedPath.value = milestones[0]?.taskLists[0]?.tasks[0]?.path ?? milestones[0]?.record?.path ?? null
    }
})

const context = computed(() => {
    const segments = selected.value?.path.split('/').slice(2, -1) ?? []

    return [segments[0], segments[2]].filter(Boolean).join(' › ')
})

const properties = computed(() => {
    const record = selected.value?.record

    if (!record) {
        return []
    }

    return [
        { label: 'Owner', value: record.owners_and_work?.owners?.map(personName).join(', ') || '—' },
        { label: 'Start', value: formatDate(record.start_date) },
        { label: 'Due', value: formatDate(record.end_date ?? record.due_date) },
        { label: 'Priority', value: record.priority ?? '—' },
        {
            label: 'Complete',
            value: record.completion_percentage === undefined ? '—' : `${record.completion_percentage}%`,
        },
        { label: 'Logged', value: record.log_hours?.total_hours ?? '—' },
        { label: 'Modified', value: formatDate(record.last_modified_time ?? record.last_updated_time) },
    ]
})

function toggle(key: string) {
    if (collapsed.has(key)) {
        collapsed.delete(key)
    } else {
        collapsed.add(key)
    }
}

function statusColor(loaded: LoadedRecord) {
    return isClosed(loaded.record) ? 'bg-ok' : loaded.record.status?.name ? 'bg-warn' : 'bg-faint'
}
</script>

<template>
    <EmptyState
        v-if="tree.length === 0"
        title="No Zoho Projects data yet"
        message="Pull the milestones, then task lists and tasks."
        :group="milestonesGroup"
    />
    <ListDetailLayout v-else v-model:filter="filter" :item-count="visibleTaskCount">
        <template #list-tools>
            <div class="inline-flex overflow-hidden rounded-md border border-line text-xs">
                <button
                    type="button"
                    class="px-2.5"
                    :class="onlyOpen ? 'bg-hover text-fg' : 'text-muted'"
                    @click="onlyOpen = true"
                >
                    Open
                </button>
                <button
                    type="button"
                    class="px-2.5"
                    :class="!onlyOpen ? 'bg-hover text-fg' : 'text-muted'"
                    @click="onlyOpen = false"
                >
                    All
                </button>
            </div>
        </template>
        <template #list>
            <div role="tree">
                <template v-for="milestone in visibleTree" :key="milestone.name">
                    <ExplorerItem
                        :label="milestone.name"
                        :indent="-1"
                        :active="selectedPath === milestone.record?.path"
                        class="font-medium"
                        :aria-expanded="!collapsed.has(milestone.name)"
                        @click="(toggle(milestone.name), milestone.record && (selectedPath = milestone.record.path))"
                    >
                        <template #prefix>
                            <ChevronRight
                                :size="13"
                                class="shrink-0 opacity-60 transition-transform"
                                :class="!collapsed.has(milestone.name) && 'rotate-90'"
                            />
                            <Flag :size="14" class="shrink-0 opacity-70" />
                        </template>
                    </ExplorerItem>
                    <template v-if="!collapsed.has(milestone.name)">
                        <template v-for="taskList in milestone.taskLists" :key="taskList.name">
                            <ExplorerItem
                                :label="taskList.name"
                                :meta="String(taskList.tasks.length)"
                                :active="selectedPath === taskList.record?.path"
                                :aria-expanded="!collapsed.has(`${milestone.name}/${taskList.name}`)"
                                @click="
                                    (toggle(`${milestone.name}/${taskList.name}`),
                                    taskList.record && (selectedPath = taskList.record.path))
                                "
                            >
                                <template #prefix>
                                    <ChevronRight
                                        :size="13"
                                        class="shrink-0 opacity-60 transition-transform"
                                        :class="!collapsed.has(`${milestone.name}/${taskList.name}`) && 'rotate-90'"
                                    />
                                    <ListTodo :size="14" class="shrink-0 opacity-70" />
                                </template>
                            </ExplorerItem>
                            <template v-if="!collapsed.has(`${milestone.name}/${taskList.name}`)">
                                <ExplorerItem
                                    v-for="task in taskList.tasks"
                                    :key="task.path"
                                    :label="task.record.name"
                                    :indent="2"
                                    :active="selectedPath === task.path"
                                    @click="selectedPath = task.path"
                                >
                                    <template #prefix>
                                        <span class="size-2 shrink-0 rounded-full" :class="statusColor(task)" />
                                        <span
                                            v-if="task.record.prefix"
                                            class="shrink-0 font-mono text-[11px] opacity-60"
                                        >
                                            {{ task.record.prefix }}
                                        </span>
                                    </template>
                                </ExplorerItem>
                            </template>
                        </template>
                    </template>
                </template>
            </div>
        </template>
        <template #detail>
            <RecordDetail v-if="selected" :loaded="selected" :context="context" :properties="properties" />
            <EmptyState v-else title="Nothing selected" />
        </template>
    </ListDetailLayout>
</template>
