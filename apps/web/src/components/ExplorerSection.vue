<script setup lang="ts">
import { ChevronRight } from '@lucide/vue'
import { ref } from 'vue'

defineProps<{ title: string; count?: number }>()
const open = ref(true)
</script>

<template>
    <div>
        <button
            type="button"
            class="flex w-full items-center gap-1 px-2 pt-2 pb-1 text-[11px] font-semibold tracking-wider text-faint uppercase hover:text-fg"
            :aria-expanded="open"
            @click="open = !open"
        >
            <ChevronRight :size="13" class="shrink-0 transition-transform" :class="open && 'rotate-90'" />
            <span class="truncate">{{ title }}</span>
            <span v-if="count !== undefined" class="ml-auto pl-2 font-mono font-normal">{{ count }}</span>
        </button>
        <div v-show="open">
            <slot />
        </div>
    </div>
</template>
