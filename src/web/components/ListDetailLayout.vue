<script setup lang="ts">
import { Search } from '@lucide/vue'
import { ref } from 'vue'

withDefaults(defineProps<{ listWidth?: string; filterPlaceholder?: string; itemCount?: number }>(), {
    listWidth: '300px',
    filterPlaceholder: 'Start typing to search…',
    itemCount: undefined,
})
const filter = defineModel<string>('filter', { default: '' })
const listElement = ref<HTMLElement | null>(null)

/** Arrow keys move the selection through the visible items, the way an IDE explorer does. */
function moveSelection(step: 1 | -1) {
    const items = Array.from(listElement.value?.querySelectorAll<HTMLElement>('[data-explorer-item]') ?? [])
    const activeIndex = items.findIndex((item) => item.dataset.active === 'true')
    const next = items[Math.min(items.length - 1, Math.max(0, activeIndex + step))]

    next?.click()
    next?.focus()
    next?.scrollIntoView({ block: 'nearest' })
}
</script>

<template>
    <div class="grid h-full" :style="{ gridTemplateColumns: `${listWidth} 1fr` }">
        <div class="flex min-h-0 flex-col border-r border-line bg-surface">
            <div class="flex items-center gap-2 border-b border-line px-3">
                <Search :size="14" class="shrink-0 text-faint" />
                <input
                    v-model="filter"
                    class="h-9 min-w-0 flex-1 bg-transparent text-[13px] outline-none"
                    :placeholder="filterPlaceholder"
                    :aria-label="filterPlaceholder"
                />
                <slot name="list-tools" />
            </div>
            <div
                ref="listElement"
                class="min-h-0 flex-1 overflow-auto py-1"
                @keydown.down.prevent="moveSelection(1)"
                @keydown.up.prevent="moveSelection(-1)"
            >
                <slot name="list" />
            </div>
            <div v-if="itemCount !== undefined" class="border-t border-line px-3 py-1.5 text-xs text-faint">
                Items: {{ itemCount }}
            </div>
        </div>
        <div class="min-h-0 min-w-0 overflow-auto">
            <slot name="detail" />
        </div>
    </div>
</template>
