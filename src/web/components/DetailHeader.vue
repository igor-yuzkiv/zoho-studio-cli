<script setup lang="ts">
import CopyPathButton from './CopyPathButton.vue'

defineProps<{ title: string; subtitle?: string; path?: string; mono?: boolean }>()
</script>

<template>
    <div class="flex items-start gap-3 border-b border-line bg-surface px-6 py-4">
        <div class="min-w-0 flex-1">
            <div v-if="subtitle" class="font-mono text-xs text-faint">{{ subtitle }}</div>
            <h1 class="truncate text-lg font-semibold tracking-tight" :class="mono && 'font-mono'">{{ title }}</h1>
            <div class="mt-1.5 flex flex-wrap gap-2">
                <slot name="badges" />
            </div>
        </div>
        <slot name="actions" />
        <CopyPathButton v-if="path" :path="path" />
    </div>
</template>
