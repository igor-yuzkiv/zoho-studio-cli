<script setup lang="ts">
import type { Component } from 'vue'

defineProps<{ label: string; active?: boolean; icon?: Component; meta?: string; mono?: boolean; indent?: number }>()
</script>

<template>
    <button
        type="button"
        data-explorer-item
        :data-active="active ? 'true' : 'false'"
        class="flex h-[26px] w-full items-center gap-1.5 pr-3 text-left text-[13px] outline-none"
        :class="active ? 'bg-accent text-white' : 'text-fg hover:bg-hover focus-visible:bg-hover'"
        :style="{ paddingLeft: `${20 + (indent ?? 0) * 14}px` }"
        :title="label"
    >
        <component :is="icon" v-if="icon" :size="14" class="shrink-0" :class="active ? 'text-white' : 'text-faint'" />
        <slot name="prefix" />
        <span class="truncate" :class="mono && 'font-mono text-xs'">{{ label }}</span>
        <span
            v-if="meta"
            class="ml-auto shrink-0 pl-2 font-mono text-[11px]"
            :class="active ? 'text-white/80' : 'text-faint'"
        >
            {{ meta }}
        </span>
    </button>
</template>
