<script setup lang="ts">
import type { AreaId } from '@cli/commands/browser/browser.types'
import { PanelLeftClose, PanelLeftOpen } from '@lucide/vue'
import { ref, watch } from 'vue'
import { RouterLink } from 'vue-router'

import { areaLabels, useProjectStore } from '@web/stores/project.store'
import { groupIcon, overviewIcon } from '@web/utils/group-icons'
import { formatCount } from '@web/utils/time.utils'

const storageKey = 'zoho-studio:sidebar-expanded'

const projectStore = useProjectStore()
const areas: AreaId[] = ['crm', 'projects']
const expanded = ref(localStorage.getItem(storageKey) === 'true')

watch(expanded, (value) => localStorage.setItem(storageKey, String(value)))

const activeClass = '!bg-accent !text-white'
</script>

<template>
    <aside
        class="flex min-h-0 flex-col gap-1 overflow-x-hidden overflow-y-auto border-r border-line bg-surface py-2 transition-[width] duration-150"
        :class="expanded ? 'w-56 px-2' : 'w-12 items-center'"
        aria-label="Artifact groups"
    >
        <RouterLink
            :to="{ name: 'overview' }"
            class="nav-link group"
            :class="expanded ? 'w-full px-2' : 'size-9 justify-center'"
            :exact-active-class="activeClass"
            aria-label="Overview"
        >
            <component :is="overviewIcon" :size="18" class="shrink-0" />
            <span v-if="expanded">Overview</span>
            <span v-else class="activity-tooltip">Overview</span>
        </RouterLink>

        <template v-for="area in areas" :key="area">
            <div
                v-if="expanded"
                class="flex items-center gap-1.5 px-2 pt-3 pb-1 text-[11px] font-semibold tracking-wider text-faint uppercase"
            >
                <span class="size-1.5 rounded-full" :class="area === 'crm' ? 'bg-crm' : 'bg-projects'" />
                {{ areaLabels[area] }}
            </div>
            <template v-else>
                <div class="my-1 h-px w-6 bg-line" />
                <span
                    class="size-1.5 rounded-full"
                    :class="area === 'crm' ? 'bg-crm' : 'bg-projects'"
                    :title="areaLabels[area]"
                />
            </template>
            <RouterLink
                v-for="group in projectStore.navigationGroups[area]"
                :key="group.id"
                :to="{ name: 'group', params: { area, group: group.id } }"
                class="nav-link group"
                :class="expanded ? 'w-full px-2' : 'size-9 justify-center'"
                :active-class="activeClass"
                :aria-label="`${group.label}, ${formatCount(group.count)}`"
            >
                <component :is="groupIcon(group.id)" :size="18" class="shrink-0" />
                <template v-if="expanded">
                    <span class="truncate">{{ group.label }}</span>
                    <span v-if="group.count === null" class="size-1.5 shrink-0 rounded-full bg-warn" />
                    <span class="ml-auto font-mono text-xs opacity-70">{{ formatCount(group.count) }}</span>
                </template>
                <template v-else>
                    <span v-if="group.count === null" class="absolute top-1 right-1 size-1.5 rounded-full bg-warn" />
                    <span class="activity-tooltip">
                        {{ areaLabels[area] }} · {{ group.label }}
                        <span class="font-mono opacity-70">{{ formatCount(group.count) }}</span>
                    </span>
                </template>
            </RouterLink>
        </template>

        <button
            type="button"
            class="nav-link group mt-auto"
            :class="expanded ? 'w-full px-2' : 'size-9 justify-center'"
            :aria-label="expanded ? 'Collapse the menu' : 'Expand the menu'"
            :aria-expanded="expanded"
            @click="expanded = !expanded"
        >
            <component :is="expanded ? PanelLeftClose : PanelLeftOpen" :size="18" class="shrink-0" />
            <span v-if="expanded">Collapse</span>
            <span v-else class="activity-tooltip">Expand the menu</span>
        </button>
    </aside>
</template>
