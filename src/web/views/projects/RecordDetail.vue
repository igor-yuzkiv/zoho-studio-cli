<script setup lang="ts">
import { computed, ref } from 'vue'

import AppBadge from '@web/components/AppBadge.vue'
import DetailHeader from '@web/components/DetailHeader.vue'
import JsonViewer from '@web/components/JsonViewer.vue'
import RichText from '@web/components/RichText.vue'
import { useProjectStore } from '@web/stores/project.store'
import { formatDate, joinAbsolutePath } from '@web/utils/bundle.utils'

import { isClosed, personName, type LoadedRecord } from './projects.utils'

const props = defineProps<{ loaded: LoadedRecord; context?: string; properties: { label: string; value: string }[] }>()

const projectStore = useProjectStore()
const view = ref<'rendered' | 'json'>('rendered')
const record = computed(() => props.loaded.record)
</script>

<template>
    <DetailHeader
        :title="record.name"
        :subtitle="record.prefix"
        :path="joinAbsolutePath(projectStore.project?.sourcePath, loaded.directory)"
    >
        <template #badges>
            <AppBadge v-if="record.status?.name" :tone="isClosed(record) ? 'ok' : 'warn'"
                >● {{ record.status.name }}</AppBadge
            >
            <AppBadge v-if="context">{{ context }}</AppBadge>
        </template>
        <template #actions>
            <div class="inline-flex overflow-hidden rounded-md border border-line text-xs">
                <button
                    v-for="option in ['rendered', 'json'] as const"
                    :key="option"
                    type="button"
                    class="px-2.5 py-1"
                    :class="view === option ? 'bg-hover text-fg' : 'text-muted'"
                    @click="view = option"
                >
                    {{ option === 'rendered' ? 'Rendered' : 'Raw JSON' }}
                </button>
            </div>
        </template>
    </DetailHeader>

    <div v-if="view === 'rendered'" class="max-w-[820px] px-7 py-5">
        <dl
            class="grid grid-cols-[120px_1fr] gap-x-4 gap-y-1.5 rounded-[9px] border border-line bg-surface px-4 py-3.5 text-[13px]"
        >
            <template v-for="property in properties" :key="property.label">
                <dt class="text-faint">{{ property.label }}</dt>
                <dd>{{ property.value }}</dd>
            </template>
        </dl>

        <div v-if="record.tags?.length" class="mt-3 flex flex-wrap gap-1.5">
            <AppBadge v-for="tag in record.tags" :key="tag.name">{{ tag.name }}</AppBadge>
        </div>

        <h2 class="mt-5 mb-2 text-[15px] font-semibold">Description</h2>
        <RichText v-if="record.description" :html="record.description" />
        <p v-else class="text-faint">No description.</p>

        <h2 class="mt-5 mb-2 text-[15px] font-semibold">Comments · {{ loaded.comments.length }}</h2>
        <div v-for="comment in loaded.comments" :key="comment.id" class="my-2.5 border-l-2 border-line py-1 pl-3">
            <b class="font-medium">{{ personName(comment.created_by ?? comment.added_by) }}</b>
            <small class="ml-1.5 text-faint">{{ formatDate(comment.created_time) }}</small>
            <RichText :html="comment.comment ?? ''" />
        </div>
    </div>
    <JsonViewer v-else :value="{ ...record, comments: loaded.comments }" />
</template>
