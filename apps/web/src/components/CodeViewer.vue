<script setup lang="ts">
import { computed } from 'vue'

import { highlightLines, type CodeLanguage } from '@web/utils/highlight.utils'

const props = defineProps<{ source: string; language: CodeLanguage }>()

// Very large files are shown plain: tokenizing them would freeze the page for little benefit.
const highlightLimit = 400_000
const lines = computed(() =>
    highlightLines(props.source, props.source.length > highlightLimit ? 'text' : props.language)
)
</script>

<template>
    <!-- eslint-disable vue/no-v-html -- highlightLines escapes every character it emits -->
    <pre
        class="m-4 overflow-auto rounded-[10px] border border-line bg-surface py-4 font-mono text-[13px] leading-[1.65]"
    ><code><span v-for="(line, index) in lines" :key="index" class="flex"><span class="w-[52px] shrink-0 pr-4 text-right text-faint select-none">{{ index + 1 }}</span><span class="pr-6 whitespace-pre" v-html="line || ' '" /></span></code></pre>
</template>
