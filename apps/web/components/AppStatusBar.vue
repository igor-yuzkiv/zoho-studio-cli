<script setup lang="ts">
import { Moon, Sun } from '@lucide/vue'
import { computed } from 'vue'

import { useProjectStore } from '@web/stores/project.store'
import { useThemeStore } from '@web/stores/theme.store'
import { useUiStore } from '@web/stores/ui.store'
import { formatTimeAgo } from '@web/utils/time.utils'

const projectStore = useProjectStore()
const theme = useThemeStore()
const ui = useUiStore()

const run = computed(() => projectStore.latestRun)
const runTone = computed(() => {
    switch (run.value?.status) {
        case 'done':
            return 'text-ok'
        case 'partial':
            return 'text-warn'
        case 'failed':
            return 'text-err'
        default:
            return 'text-accent'
    }
})
const itemClass = 'flex h-full items-center gap-1.5 px-2.5 hover:bg-hover'
</script>

<template>
    <footer class="flex h-7 shrink-0 items-center border-t border-line bg-surface text-xs text-muted">
        <span class="flex h-full items-center gap-1.5 bg-accent px-3 font-medium text-white">
            {{ projectStore.project?.name ?? 'Zoho Studio' }}
        </span>
        <button type="button" :class="itemClass" @click="ui.loginDialogOpen = true">
            <span
                class="size-1.5 rounded-full"
                :class="projectStore.project?.auth.default === 'authorized' ? 'bg-ok' : 'bg-err'"
            />
            {{ projectStore.project?.auth.default === 'authorized' ? 'Authorized' : 'Not logged in — log in' }}
        </button>
        <button v-if="run" type="button" :class="itemClass" @click="ui.pullPanelOpen = !ui.pullPanelOpen">
            <span
                v-if="run.status === 'running'"
                class="size-3 animate-spin rounded-full border-2 border-line border-t-accent"
            />
            <span :class="runTone">{{ run.status }}</span>
            <span class="font-mono">{{ run.command }}</span>
            <span v-if="run.status === 'running'">{{ run.completed }}/{{ run.total }}</span>
            <span v-else class="text-faint">{{ formatTimeAgo(run.finishedAt) }}</span>
        </button>
        <span class="flex-1" />
        <span class="truncate px-2.5 font-mono text-faint">{{ projectStore.project?.sourcePath }}</span>
        <button
            type="button"
            :class="itemClass"
            :aria-label="`Switch to ${theme.theme === 'dark' ? 'light' : 'dark'} theme`"
            @click="theme.toggle()"
        >
            <component :is="theme.theme === 'dark' ? Moon : Sun" :size="14" />
        </button>
    </footer>
</template>
