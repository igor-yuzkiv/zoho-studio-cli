<script setup lang="ts">
import { computed } from 'vue'

import { sanitizeHtml } from '@web/utils/html.utils'

const props = defineProps<{ html: string }>()
const safeHtml = computed(() => sanitizeHtml(props.html))
</script>

<template>
    <!-- eslint-disable vue/no-v-html -- sanitizeHtml rebuilds the markup from an allow-list -->
    <div class="rich-text" v-html="safeHtml" />
</template>
