<script setup lang="ts">
withDefaults(defineProps<{ tone?: 'neutral' | 'ok' | 'warn' | 'err' | 'accent' }>(), { tone: 'neutral' })
</script>

<template>
    <span
        class="inline-flex items-center gap-1 rounded-full border border-line px-2 text-xs leading-5"
        :class="{
            'text-muted': tone === 'neutral',
            'text-ok': tone === 'ok',
            'text-warn': tone === 'warn',
            'text-err': tone === 'err',
            'text-accent': tone === 'accent',
        }"
    >
        <slot />
    </span>
</template>
