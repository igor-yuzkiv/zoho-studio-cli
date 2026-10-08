<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import { areaLabels, useCatalogStore, type AreaId } from '@web/stores/catalog.store'
import { useThemeStore } from '@web/stores/theme.store'

import AppButton from './AppButton.vue'

const route = useRoute()
const catalog = useCatalogStore()
const theme = useThemeStore()

const currentGroup = computed(() =>
    route.name === 'group' ? catalog.findGroup(String(route.params.area), String(route.params.group)) : undefined
)
</script>

<template>
    <header class="flex h-13 shrink-0 items-center gap-3 border-b border-line px-5">
        <div class="flex items-center gap-1.5 text-faint">
            <template v-if="currentGroup">
                {{ areaLabels[currentGroup.area as AreaId] }} <span>/</span>
                <b class="font-medium text-fg">{{ currentGroup.label }}</b>
            </template>
            <b v-else class="font-medium text-fg">Overview</b>
        </div>
        <div class="flex-1" />
        <slot name="actions" />
        <AppButton
            class="w-8 justify-center !px-0"
            :aria-label="`Switch to ${theme.theme === 'dark' ? 'light' : 'dark'} theme`"
            @click="theme.toggle()"
        >
            {{ theme.theme === 'dark' ? '☾' : '☀' }}
        </AppButton>
    </header>
</template>
