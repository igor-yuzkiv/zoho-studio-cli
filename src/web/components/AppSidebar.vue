<script setup lang="ts">
import type { AreaId } from '@cli/commands/browser/browser.types'
import { RouterLink } from 'vue-router'

import { areaLabels, useProjectStore } from '@web/stores/project.store'
import { formatCount } from '@web/utils/time.utils'

const projectStore = useProjectStore()
const areas: AreaId[] = ['crm', 'projects']
const linkClass =
    'flex items-center gap-2 rounded-md px-2 py-1.5 text-muted transition-colors hover:bg-hover hover:text-fg'
</script>

<template>
    <aside class="flex min-h-0 flex-col border-r border-line bg-surface">
        <div class="flex items-center gap-2.5 px-4 pt-4 pb-3">
            <div class="grid size-7 shrink-0 place-items-center rounded-md bg-accent text-[13px] font-bold text-white">
                ZS
            </div>
            <div class="min-w-0">
                <div class="truncate font-semibold">{{ projectStore.project?.name ?? 'Zoho Studio' }}</div>
                <div class="text-xs text-faint">Zoho Studio · local</div>
            </div>
        </div>

        <nav class="min-h-0 flex-1 overflow-auto px-2 pb-4" aria-label="Artifact groups">
            <RouterLink :to="{ name: 'overview' }" :class="linkClass" exact-active-class="!bg-accent-soft !text-fg">
                Overview
            </RouterLink>

            <template v-for="area in areas" :key="area">
                <h2
                    class="flex items-center gap-1.5 px-2 pt-3.5 pb-1.5 text-[11px] font-medium tracking-wider text-faint uppercase"
                >
                    <span class="size-1.5 rounded-full" :class="area === 'crm' ? 'bg-crm' : 'bg-projects'" />
                    {{ areaLabels[area] }}
                </h2>
                <RouterLink
                    v-for="group in projectStore.navigationGroups[area]"
                    :key="group.id"
                    :to="{ name: 'group', params: { area, group: group.id } }"
                    :class="linkClass"
                    active-class="!bg-accent-soft !text-fg"
                >
                    {{ group.label }}
                    <span
                        v-if="group.count === null"
                        class="size-1.5 rounded-full bg-warn"
                        title="Never pulled"
                        aria-label="Never pulled"
                    />
                    <span class="ml-auto font-mono text-xs text-faint">{{ formatCount(group.count) }}</span>
                </RouterLink>
            </template>
        </nav>

        <div class="flex items-center gap-2 border-t border-line px-4 py-3 text-xs text-faint">
            <span
                class="size-1.5 rounded-full"
                :class="projectStore.project?.auth === 'authorized' ? 'bg-ok' : 'bg-err'"
            />
            {{ projectStore.project?.auth === 'authorized' ? 'Authorized' : 'Not logged in' }}
        </div>
    </aside>
</template>
