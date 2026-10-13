<script setup lang="ts" generic="TTab extends string">
defineProps<{ tabs: { id: TTab; label: string }[] }>()
const active = defineModel<TTab>({ required: true })
</script>

<template>
    <div class="flex gap-0.5 border-b border-line bg-surface px-6" role="tablist">
        <button
            v-for="tab in tabs"
            :key="tab.id"
            type="button"
            role="tab"
            :aria-selected="active === tab.id"
            class="-mb-px border-b-2 px-3 py-2.5 transition-colors"
            :class="active === tab.id ? 'border-accent text-fg' : 'border-transparent text-muted hover:text-fg'"
            @click="active = tab.id"
        >
            {{ tab.label }}
        </button>
    </div>
</template>
