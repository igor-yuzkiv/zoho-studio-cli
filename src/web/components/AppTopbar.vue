<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import { areaLabels, useProjectStore } from '@web/stores/project.store'
import { useThemeStore } from '@web/stores/theme.store'
import { useUiStore } from '@web/stores/ui.store'
import { formatTimeAgo } from '@web/utils/time.utils'

import AppBadge from './AppBadge.vue'
import AppButton from './AppButton.vue'
import CopyPathButton from './CopyPathButton.vue'

const route = useRoute()
const projectStore = useProjectStore()
const theme = useThemeStore()
const ui = useUiStore()

const currentGroup = computed(() =>
    route.name === 'group' ? projectStore.findGroup(String(route.params.area), String(route.params.group)) : undefined
)
</script>

<template>
    <header class="flex h-13 shrink-0 items-center gap-3 border-b border-line px-5">
        <div class="flex min-w-0 items-center gap-1.5 text-faint">
            <template v-if="currentGroup">
                {{ areaLabels[currentGroup.area] }} <span>/</span>
                <b class="font-medium text-fg">{{ currentGroup.label }}</b>
                <AppBadge class="ml-1.5">pulled {{ formatTimeAgo(currentGroup.pulledAt) }}</AppBadge>
            </template>
            <b v-else class="font-medium text-fg">Overview</b>
        </div>
        <div class="flex-1" />
        <CopyPathButton v-if="currentGroup" :path="currentGroup.absolutePath" />
        <AppButton v-if="projectStore.latestRun" @click="ui.pullPanelOpen = !ui.pullPanelOpen">Pull log</AppButton>
        <AppButton v-if="currentGroup" variant="primary" @click="ui.openPullDialog(currentGroup)">↓ Pull</AppButton>
        <AppButton
            class="w-8 justify-center !px-0"
            :aria-label="`Switch to ${theme.theme === 'dark' ? 'light' : 'dark'} theme`"
            @click="theme.toggle()"
        >
            {{ theme.theme === 'dark' ? '☾' : '☀' }}
        </AppButton>
    </header>
</template>
