<script setup lang="ts">
import { computed, ref } from 'vue'

import { api } from '@web/api/api.client'
import AppBadge from '@web/components/AppBadge.vue'
import EmptyState from '@web/components/EmptyState.vue'
import { useApiData } from '@web/composables/useApiData'
import { useProjectStore } from '@web/stores/project.store'
import { formatDate, matchesFilter } from '@web/utils/bundle.utils'
import { formatTimeAgo } from '@web/utils/time.utils'

import RecordDetail from './RecordDetail.vue'
import { isClosed, loadRecords, personName, type LoadedRecord } from './projects.utils'

const projectStore = useProjectStore()
const group = computed(() => projectStore.findGroup('projects', 'issues'))
const filter = ref('')
const showClosed = ref(false)
const selectedPath = ref<string | null>(null)

const { data: bundle } = useApiData(() => api.getJson('zoho-projects/raw/issues').catch(() => ({})))

const issues = computed(() =>
    loadRecords(bundle.value).sort((left, right) =>
        String(right.record.last_updated_time ?? '').localeCompare(String(left.record.last_updated_time ?? ''))
    )
)
const openCount = computed(() => issues.value.filter(({ record }) => !isClosed(record)).length)
const visibleIssues = computed(() =>
    issues.value.filter(
        ({ record }) => isClosed(record) === showClosed.value && matchesFilter(filter.value, record.name, record.prefix)
    )
)
const selected = computed(() => issues.value.find(({ path }) => path === selectedPath.value) ?? null)

const properties = computed(() => {
    const record = selected.value?.record

    return record
        ? [
              { label: 'Assignee', value: personName(record.assignee) },
              { label: 'Severity', value: record.severity?.value ?? '—' },
              { label: 'Classification', value: record.classification?.value ?? '—' },
              { label: 'Reported by', value: personName(record.created_by) },
              { label: 'Due', value: formatDate(record.due_date) },
              { label: 'Updated', value: formatDate(record.last_updated_time) },
          ]
        : []
})

function severityTone(loaded: LoadedRecord) {
    const severity = loaded.record.severity?.value?.toLowerCase() ?? ''

    return severity.includes('critical') || severity.includes('show')
        ? 'err'
        : severity.includes('major')
          ? 'warn'
          : 'neutral'
}
</script>

<template>
    <EmptyState v-if="issues.length === 0" title="No issues pulled yet" :group="group" />
    <div v-else-if="selected" class="h-full overflow-auto">
        <button type="button" class="px-7 pt-4 text-[13px] text-muted hover:text-fg" @click="selectedPath = null">
            ← All issues
        </button>
        <RecordDetail :loaded="selected" :properties="properties" />
    </div>
    <section v-else class="px-7 py-6">
        <div class="flex flex-wrap items-end gap-3">
            <div class="flex-1">
                <h1 class="text-[22px] font-semibold tracking-tight">Issues</h1>
                <div class="mt-0.5 text-muted">
                    {{ issues.length }} issues · pulled {{ formatTimeAgo(group?.pulledAt ?? null) }}
                </div>
            </div>
            <input
                v-model="filter"
                class="h-[30px] w-60 rounded-md border border-line bg-surface px-2.5 text-[13px]"
                placeholder="Filter issues"
                aria-label="Filter issues"
            />
            <div class="inline-flex overflow-hidden rounded-md border border-line text-xs">
                <button
                    type="button"
                    class="px-2.5 py-1.5"
                    :class="!showClosed ? 'bg-hover text-fg' : 'text-muted'"
                    @click="showClosed = false"
                >
                    Open · {{ openCount }}
                </button>
                <button
                    type="button"
                    class="px-2.5 py-1.5"
                    :class="showClosed ? 'bg-hover text-fg' : 'text-muted'"
                    @click="showClosed = true"
                >
                    Closed · {{ issues.length - openCount }}
                </button>
            </div>
        </div>
        <div class="mt-4 overflow-hidden rounded-[10px] border border-line bg-surface">
            <table class="w-full text-[13px]">
                <thead>
                    <tr class="text-left text-faint">
                        <th class="border-b border-line bg-surface-2 px-3.5 py-2 font-medium">Key</th>
                        <th class="border-b border-line bg-surface-2 px-3.5 py-2 font-medium">Title</th>
                        <th class="border-b border-line bg-surface-2 px-3.5 py-2 font-medium">Severity</th>
                        <th class="border-b border-line bg-surface-2 px-3.5 py-2 font-medium">Status</th>
                        <th class="border-b border-line bg-surface-2 px-3.5 py-2 font-medium">Assignee</th>
                        <th class="border-b border-line bg-surface-2 px-3.5 py-2 font-medium">Updated</th>
                    </tr>
                </thead>
                <tbody>
                    <tr
                        v-for="issue in visibleIssues"
                        :key="issue.path"
                        class="cursor-pointer border-b border-line last:border-0 hover:bg-hover"
                        tabindex="0"
                        @click="selectedPath = issue.path"
                        @keydown.enter="selectedPath = issue.path"
                    >
                        <td class="px-3.5 py-2 font-mono text-faint">{{ issue.record.prefix ?? issue.record.id }}</td>
                        <td class="px-3.5 py-2">{{ issue.record.name }}</td>
                        <td class="px-3.5 py-2">
                            <AppBadge v-if="issue.record.severity?.value" :tone="severityTone(issue)">
                                {{ issue.record.severity.value }}
                            </AppBadge>
                        </td>
                        <td class="px-3.5 py-2">{{ issue.record.status?.name ?? '—' }}</td>
                        <td class="px-3.5 py-2">{{ personName(issue.record.assignee) }}</td>
                        <td class="px-3.5 py-2 whitespace-nowrap text-faint">
                            {{ formatTimeAgo(issue.record.last_updated_time ?? null) }}
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </section>
</template>
