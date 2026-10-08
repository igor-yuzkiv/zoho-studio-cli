<script setup lang="ts">
defineProps<{ active?: boolean }>()
</script>

<template>
    <button
        type="button"
        class="block w-full border-b border-line px-3.5 py-2.5 text-left transition-colors hover:bg-hover"
        :class="active && 'bg-accent-soft shadow-[inset_2px_0_var(--zs-accent)]'"
    >
        <slot />
    </button>
</template>
