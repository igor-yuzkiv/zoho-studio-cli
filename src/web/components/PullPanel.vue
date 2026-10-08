<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'

import { useProjectStore } from '@web/stores/project.store'
import { useUiStore } from '@web/stores/ui.store'

import AppBadge from './AppBadge.vue'

const ui = useUiStore()
const projectStore = useProjectStore()
const logElement = ref<HTMLElement | null>(null)

const run = computed(() => projectStore.latestRun)
const percent = computed(() => {
    if (!run.value) {
        return 0
    }

    if (run.value.status !== 'running') {
        return 100
    }

    return run.value.total ? Math.round((run.value.completed / run.value.total) * 100) : 0
})

const statusTone = computed(() => {
    switch (run.value?.status) {
        case 'done':
            return 'ok'
        case 'partial':
            return 'warn'
        case 'failed':
            return 'err'
        default:
            return 'neutral'
    }
})

watch(
    () => run.value?.log.length,
    async () => {
        await nextTick()
        logElement.value?.scrollTo({ top: logElement.value.scrollHeight })
    }
)
</script>

<template>
    <section
        class="fixed right-4 bottom-4 z-40 w-[440px] max-w-[calc(100vw-2rem)] rounded-xl border border-line bg-surface shadow-2xl transition-transform duration-250"
        :class="ui.pullPanelOpen && run ? 'translate-y-0' : 'translate-y-[calc(100%+2rem)]'"
        aria-live="polite"
        aria-label="Pull progress"
    >
        <template v-if="run">
            <header class="flex items-center gap-2.5 border-b border-line px-3.5 py-3">
                <span
                    v-if="run.status === 'running'"
                    class="size-3.5 animate-spin rounded-full border-2 border-line border-t-accent"
                />
                <b class="truncate font-mono text-[13px] font-medium">{{ run.command }}</b>
                <AppBadge class="ml-auto shrink-0" :tone="statusTone">{{ run.status }}</AppBadge>
                <button
                    type="button"
                    aria-label="Close pull progress"
                    class="px-1 text-muted"
                    @click="ui.pullPanelOpen = false"
                >
                    ✕
                </button>
            </header>
            <div class="mx-3.5 mt-2.5 h-1 overflow-hidden rounded bg-surface-2">
                <i class="block h-full bg-accent transition-[width] duration-300" :style="{ width: `${percent}%` }" />
            </div>
            <div
                ref="logElement"
                class="max-h-52 overflow-auto px-3.5 py-2.5 font-mono text-xs leading-relaxed text-muted"
            >
                <div v-if="run.status === 'running'">
                    {{ run.completed }} / {{ run.total
                    }}<template v-if="run.currentItem"> · {{ run.currentItem }}</template>
                </div>
                <div v-for="(line, index) in run.log" :key="index" class="whitespace-pre-wrap">{{ line }}</div>
                <div v-if="projectStore.pendingAreaPulls.length" class="mt-1 text-faint">
                    Queued: {{ projectStore.pendingAreaPulls.map((group) => group.label).join(', ') }}
                </div>
            </div>
        </template>
    </section>
</template>
