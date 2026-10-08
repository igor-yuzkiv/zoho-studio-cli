<script setup lang="ts">
withDefaults(defineProps<{ listWidth?: string; filterPlaceholder?: string }>(), {
    listWidth: '320px',
    filterPlaceholder: 'Filter',
})
const filter = defineModel<string>('filter', { default: '' })
</script>

<template>
    <div class="grid h-full" :style="{ gridTemplateColumns: `${listWidth} 1fr` }">
        <div class="min-h-0 overflow-auto border-r border-line">
            <div class="sticky top-0 z-10 flex gap-2 border-b border-line bg-bg p-3">
                <input
                    v-model="filter"
                    class="h-[30px] min-w-0 flex-1 rounded-md border border-line bg-surface px-2.5 text-[13px]"
                    :placeholder="filterPlaceholder"
                    :aria-label="filterPlaceholder"
                />
                <slot name="list-tools" />
            </div>
            <slot name="list" />
        </div>
        <div class="min-h-0 min-w-0 overflow-auto">
            <slot name="detail" />
        </div>
    </div>
</template>
