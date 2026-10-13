<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

import { areaLabels, pullGroupsByScreen, useProjectStore } from '@web/stores/project.store'
import { useUiStore } from '@web/stores/ui.store'
import { groupIcon } from '@web/utils/group-icons'
import { formatTimeAgo } from '@web/utils/time.utils'

import AppBadge from './AppBadge.vue'
import AppButton from './AppButton.vue'
import CopyPathButton from './CopyPathButton.vue'

const route = useRoute()
const projectStore = useProjectStore()
const ui = useUiStore()

const pullMenuOpen = ref(false)

const currentGroup = computed(() =>
    route.name === 'group' ? projectStore.findGroup(String(route.params.area), String(route.params.group)) : undefined
)

const pullGroups = computed(() => {
    const group = currentGroup.value

    if (!group) {
        return []
    }

    return (pullGroupsByScreen[group.id] ?? [group.id])
        .map((id) => projectStore.findGroup(group.area, id))
        .filter((candidate) => candidate !== undefined)
})

watch(currentGroup, () => (pullMenuOpen.value = false))
</script>

<template>
    <header class="flex h-11 shrink-0 items-center gap-3 border-b border-line bg-surface px-4">
        <div class="flex min-w-0 items-center gap-1.5 text-faint">
            <template v-if="currentGroup">
                <component :is="groupIcon(currentGroup.id)" :size="15" class="text-accent" />
                {{ areaLabels[currentGroup.area] }} <span>/</span>
                <b class="font-medium text-fg">{{ currentGroup.label }}</b>
                <AppBadge class="ml-1.5">pulled {{ formatTimeAgo(currentGroup.pulledAt) }}</AppBadge>
            </template>
            <b v-else class="font-medium text-fg">Overview</b>
        </div>
        <div class="flex-1" />
        <CopyPathButton v-if="currentGroup" :path="currentGroup.absolutePath" />
        <div v-if="currentGroup" class="relative">
            <AppButton
                variant="primary"
                size="sm"
                :aria-expanded="pullGroups.length > 1 ? pullMenuOpen : undefined"
                @click="pullGroups.length > 1 ? (pullMenuOpen = !pullMenuOpen) : ui.openPullDialog(currentGroup)"
            >
                ↓ Pull<template v-if="pullGroups.length > 1"> ▾</template>
            </AppButton>
            <div
                v-if="pullMenuOpen"
                class="absolute top-full right-0 z-40 mt-1 w-56 overflow-hidden rounded-lg border border-line bg-surface py-1 shadow-xl"
                role="menu"
            >
                <button
                    v-for="group in pullGroups"
                    :key="group.id"
                    type="button"
                    role="menuitem"
                    class="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[13px] hover:bg-hover"
                    @click="((pullMenuOpen = false), ui.openPullDialog(group))"
                >
                    <component :is="groupIcon(group.id)" :size="14" class="text-faint" />
                    {{ group.label }}
                    <span class="ml-auto font-mono text-[11px] text-faint">{{ formatTimeAgo(group.pulledAt) }}</span>
                </button>
            </div>
        </div>
    </header>
</template>
