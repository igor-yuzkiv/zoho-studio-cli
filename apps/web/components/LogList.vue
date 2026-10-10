<script setup lang="ts">
import type { LogEntry, LogLevel } from '@cli/commands/browser/browser.types'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

import { api } from '@web/api/api.client'
import { useProjectStore } from '@web/stores/project.store'

import AppBadge from './AppBadge.vue'
import CopyPathButton from './CopyPathButton.vue'
import JsonViewer from './JsonViewer.vue'

const projectStore = useProjectStore()
const entries = ref<LogEntry[]>([])
const nextCursor = ref<number | null>(null)
const filePath = ref<string | null>(null)
const loading = ref(false)
const finished = ref(false)
const expandedLine = ref<number | null>(null)
const sentinel = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

const levelTones: Record<LogLevel, 'neutral' | 'ok' | 'warn' | 'err'> = {
    trace: 'neutral',
    debug: 'neutral',
    info: 'ok',
    warn: 'warn',
    error: 'err',
    fatal: 'err',
}

async function loadMore(reset = false) {
    if (loading.value || (!reset && finished.value)) {
        return
    }

    loading.value = true

    try {
        const page = await api.getLogs(reset ? null : nextCursor.value)
        entries.value = reset ? page.entries : [...entries.value, ...page.entries]
        nextCursor.value = page.nextCursor
        filePath.value = page.filePath
        finished.value = page.nextCursor === null
    } finally {
        loading.value = false
    }
}

function formatTime(isoTime: string | null) {
    return isoTime
        ? new Date(isoTime).toLocaleString('en', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false,
          })
        : '—'
}

onMounted(async () => {
    await loadMore(true)
    observer = new IntersectionObserver((observed) => {
        if (observed.some((entry) => entry.isIntersecting)) {
            void loadMore()
        }
    })

    if (sentinel.value) {
        observer.observe(sentinel.value)
    }
})

onBeforeUnmount(() => observer?.disconnect())

// A finished pull has written new lines at the top.
watch(
    () => projectStore.dataVersion,
    () => loadMore(true)
)
</script>

<template>
    <div class="overflow-hidden rounded-[10px] border border-line bg-surface">
        <div class="flex items-center gap-2 border-b border-line px-4 py-2 text-xs text-faint">
            <span class="truncate font-mono">{{ filePath }}</span>
            <CopyPathButton v-if="filePath" class="ml-auto shrink-0" :path="filePath" />
        </div>
        <div class="max-h-[460px] overflow-auto">
            <p v-if="!loading && entries.length === 0" class="px-4 py-6 text-center text-muted">The log is empty.</p>
            <template v-for="entry in entries" :key="entry.line">
                <button
                    type="button"
                    class="flex w-full items-center gap-3 border-b border-line px-4 py-1.5 text-left text-[13px] hover:bg-hover"
                    :aria-expanded="expandedLine === entry.line"
                    @click="expandedLine = expandedLine === entry.line ? null : entry.line"
                >
                    <time class="w-32 shrink-0 font-mono text-xs text-faint">{{ formatTime(entry.time) }}</time>
                    <AppBadge class="w-14 shrink-0 justify-center" :tone="levelTones[entry.level]">{{
                        entry.level
                    }}</AppBadge>
                    <span class="w-52 shrink-0 truncate font-mono text-xs text-muted">{{ entry.command }}</span>
                    <span class="truncate">{{ entry.message }}</span>
                    <span
                        v-if="Object.keys(entry.details).length"
                        class="ml-auto shrink-0 font-mono text-xs text-faint"
                    >
                        { }
                    </span>
                </button>
                <JsonViewer
                    v-if="expandedLine === entry.line"
                    :value="entry.details"
                    class="!my-2 border-b border-line"
                />
            </template>
            <div ref="sentinel" class="px-4 py-3 text-center text-xs text-faint">
                {{ loading ? 'Loading…' : finished ? (entries.length ? 'Start of the log' : '') : '' }}
            </div>
        </div>
    </div>
</template>
