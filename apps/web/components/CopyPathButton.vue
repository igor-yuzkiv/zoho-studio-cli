<script setup lang="ts">
import { ref } from 'vue'

const props = withDefaults(defineProps<{ path: string; label?: string }>(), { label: 'Copy path' })
const copied = ref(false)

async function copy() {
    await navigator.clipboard.writeText(props.path)
    copied.value = true
    setTimeout(() => (copied.value = false), 1500)
}
</script>

<template>
    <button
        type="button"
        class="inline-flex h-7 items-center gap-1.5 rounded-md border border-line px-2.5 text-xs text-muted transition-colors hover:border-accent hover:text-accent"
        :title="path"
        :aria-label="`${label}: ${path}`"
        @click.stop="copy"
    >
        <span aria-hidden="true">{{ copied ? '✓' : '⧉' }}</span>
        {{ copied ? 'Copied' : label }}
    </button>
</template>
