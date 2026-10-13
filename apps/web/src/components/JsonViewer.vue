<script setup lang="ts">
import { computed } from 'vue'

import CodeViewer from './CodeViewer.vue'

const props = defineProps<{ value: unknown }>()
const source = computed(() => JSON.stringify(props.value, null, 4) ?? '')
</script>

<template>
    <CodeViewer :source="source" language="json" />
</template>
