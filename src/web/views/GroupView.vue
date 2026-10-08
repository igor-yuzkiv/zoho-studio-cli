<script setup lang="ts">
import { computed } from 'vue'

import { useProjectStore } from '@web/stores/project.store'

const props = defineProps<{ area: string; group: string }>()
const projectStore = useProjectStore()
const artifactGroup = computed(() => projectStore.findGroup(props.area, props.group))
</script>

<template>
    <section class="px-7 py-6">
        <h1 class="text-[22px] font-semibold tracking-tight">{{ artifactGroup?.label ?? 'Unknown group' }}</h1>
        <p class="mt-0.5 text-muted">{{ artifactGroup?.relativePath }}</p>
    </section>
</template>
