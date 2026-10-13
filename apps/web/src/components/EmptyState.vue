<script setup lang="ts">
import type { ArtifactGroupSummary } from '@cli/commands/browser/browser.types'

import { useUiStore } from '@web/stores/ui.store'

import AppButton from './AppButton.vue'

defineProps<{ title: string; message?: string; group?: ArtifactGroupSummary }>()
const ui = useUiStore()
</script>

<template>
    <div class="grid h-full min-h-60 place-items-center p-8 text-center">
        <div>
            <div class="font-medium">{{ title }}</div>
            <p v-if="message" class="mt-1 text-muted">{{ message }}</p>
            <AppButton v-if="group" variant="primary" class="mt-4" @click="ui.openPullDialog(group)">
                ↓ Pull {{ group.label.toLowerCase() }}
            </AppButton>
        </div>
    </div>
</template>
