<script setup lang="ts">
import { computed } from 'vue'

import { useCatalogStore } from '@web/stores/catalog.store'

const props = defineProps<{ area: string; group: string }>()
const catalog = useCatalogStore()
const artifactGroup = computed(() => catalog.findGroup(props.area, props.group))
</script>

<template>
    <section class="px-7 py-6">
        <h1 class="text-[22px] font-semibold tracking-tight">{{ artifactGroup?.label ?? 'Unknown group' }}</h1>
        <p class="mt-0.5 text-muted">Artifacts of this group will appear here.</p>
    </section>
</template>
