<script setup lang="ts">
withDefaults(defineProps<{ variant?: 'default' | 'primary' | 'ghost'; size?: 'sm' | 'md' }>(), {
    variant: 'default',
    size: 'md',
})
</script>

<template>
    <button
        type="button"
        class="inline-flex items-center gap-1.5 rounded-md border font-medium whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        :class="[
            size === 'sm' ? 'h-7 px-2.5 text-xs' : 'h-8 px-3 text-[13px]',
            variant === 'primary' && 'border-accent bg-accent text-white hover:brightness-110',
            variant === 'default' && 'border-line bg-surface hover:bg-hover',
            variant === 'ghost' && 'border-transparent hover:bg-hover',
        ]"
    >
        <slot />
    </button>
</template>
