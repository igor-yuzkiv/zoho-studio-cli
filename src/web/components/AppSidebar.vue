<script setup lang="ts">
import { RouterLink } from 'vue-router'

import { areaLabels, useCatalogStore, type AreaId } from '@web/stores/catalog.store'

const catalog = useCatalogStore()
const areas: AreaId[] = ['crm', 'projects']
</script>

<template>
    <aside class="flex min-h-0 flex-col border-r border-line bg-surface">
        <div class="flex items-center gap-2.5 px-4 pt-4 pb-3">
            <div class="grid size-7 place-items-center rounded-md bg-accent text-[13px] font-bold text-white">ZS</div>
            <div>
                <div class="font-semibold">Zoho Studio</div>
                <div class="text-xs text-faint">local project</div>
            </div>
        </div>

        <nav class="min-h-0 flex-1 overflow-auto px-2 pb-4">
            <RouterLink
                :to="{ name: 'overview' }"
                class="flex items-center gap-2 rounded-md px-2 py-1.5 text-muted transition-colors hover:bg-hover hover:text-fg"
                exact-active-class="!bg-accent-soft !text-fg"
            >
                Overview
            </RouterLink>

            <template v-for="area in areas" :key="area">
                <h6
                    class="flex items-center gap-1.5 px-2 pt-3.5 pb-1.5 text-[11px] font-medium tracking-wider text-faint uppercase"
                >
                    <span class="size-1.5 rounded-full" :class="area === 'crm' ? 'bg-crm' : 'bg-projects'" />
                    {{ areaLabels[area] }}
                </h6>
                <RouterLink
                    v-for="group in catalog.groupsByArea[area]"
                    :key="group.id"
                    :to="{ name: 'group', params: { area, group: group.id } }"
                    class="flex items-center gap-2 rounded-md px-2 py-1.5 text-muted transition-colors hover:bg-hover hover:text-fg"
                    active-class="!bg-accent-soft !text-fg"
                >
                    {{ group.label }}
                    <span class="ml-auto font-mono text-xs text-faint">{{ group.count ?? '—' }}</span>
                </RouterLink>
            </template>
        </nav>
    </aside>
</template>
